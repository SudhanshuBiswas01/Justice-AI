$ErrorActionPreference = "Stop"

$PROJECT_ID="project-c25ecdc2-f2e5-412a-a2e"
$REGION="us-central1"
$DOMAIN="justiceai.app"

$DB_INSTANCE="justiceai-pg"
$DB_NAME="justiceai"
$DB_USER="justice_admin"
$DB_PASS="SuperSecretP@ssw0rd123!"

$SA_NAME="justice-ai-runner"
$SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

Write-Host "Setting active project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

Write-Host "Enabling APIs..."
gcloud services enable run.googleapis.com sqladmin.googleapis.com aiplatform.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com cloudresourcemanager.googleapis.com

Write-Host "Creating Artifact Registry repository..."
# This might fail if it already exists, so we catch the error
try {
    gcloud artifacts repositories create justice-ai-repo --repository-format=docker --location=$REGION --description="Docker repository for Justice AI"
} catch {
    Write-Host "Repository might already exist, continuing..."
}

Write-Host "Checking if Cloud SQL instance exists..."
$instanceExists = gcloud sql instances list --filter="name:$DB_INSTANCE" --format="value(name)"
if (-not $instanceExists) {
    Write-Host "Creating Cloud SQL instance (this takes 5-10 minutes)..."
    gcloud sql instances create $DB_INSTANCE --database-version=POSTGRES_15 --cpu=1 --memory=4GB --region=$REGION --edition=enterprise
    Write-Host "Creating Database..."
    gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE
    Write-Host "Creating Database User..."
    gcloud sql users create $DB_USER --instance=$DB_INSTANCE --password=$DB_PASS
} else {
    Write-Host "Cloud SQL instance already exists."
}

Write-Host "Getting DB connection name..."
$INSTANCE_CONNECTION_NAME = gcloud sql instances describe $DB_INSTANCE --format="value(connectionName)"
$DATABASE_URL = "postgresql://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}?host=/cloudsql/${INSTANCE_CONNECTION_NAME}"

Write-Host "Storing Secrets..."
# Use Write-Output to pipe to gcloud, avoid newline if possible
function Set-Secret {
    param($Name, $Value)
    try {
        gcloud secrets create $Name --replication-policy="automatic" 2>$null
    } catch {}
    Write-Output $Value | gcloud secrets versions add $Name --data-file=-
}

Set-Secret -Name "NEXTAUTH_SECRET" -Value "57c3204a1820d64325e9972a5155f8eec4f6cdeb141a45366dd391403b70ec39"
Set-Secret -Name "GOOGLE_CLIENT_ID" -Value $GOOGLE_CLIENT_ID
Set-Secret -Name "GOOGLE_CLIENT_SECRET" -Value $GOOGLE_CLIENT_SECRET
Set-Secret -Name "DATABASE_URL" -Value $DATABASE_URL

Write-Host "Creating Service Account..."
try {
    gcloud iam service-accounts create $SA_NAME --description="Identity for Justice AI Cloud Run services" 2>$null
} catch {}

Write-Host "Granting Roles..."
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:${SA_EMAIL}" --role="roles/cloudsql.client"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:${SA_EMAIL}" --role="roles/aiplatform.user"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:${SA_EMAIL}" --role="roles/secretmanager.secretAccessor"

Write-Host "Building and Pushing Backend Image..."
gcloud builds submit backend --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/justice-ai-repo/backend:latest"

Write-Host "Building and Pushing Frontend Image..."
gcloud builds submit frontend --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/justice-ai-repo/frontend:latest"

Write-Host "Deploying Backend to Cloud Run..."
gcloud run deploy justice-ai-backend `
  --image "${REGION}-docker.pkg.dev/${PROJECT_ID}/justice-ai-repo/backend:latest" `
  --region $REGION `
  --service-account $SA_EMAIL `
  --allow-unauthenticated `
  --min-instances 0 `
  --max-instances 5

$BACKEND_URL = gcloud run services describe justice-ai-backend --region=$REGION --format="value(status.url)"
Write-Host "Backend URL: $BACKEND_URL"

Write-Host "Deploying Frontend to Cloud Run..."
gcloud run deploy justice-ai-frontend `
  --image "${REGION}-docker.pkg.dev/${PROJECT_ID}/justice-ai-repo/frontend:latest" `
  --region $REGION `
  --service-account $SA_EMAIL `
  --add-cloudsql-instances $INSTANCE_CONNECTION_NAME `
  --set-env-vars NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL `
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest" `
  --allow-unauthenticated `
  --min-instances 0 `
  --max-instances 5

$FRONTEND_URL = gcloud run services describe justice-ai-frontend --region=$REGION --format="value(status.url)"
Write-Host "Frontend URL: $FRONTEND_URL"

Write-Host "Deployment Completed Successfully!"
