$ErrorActionPreference = "Stop"

$PROJECT_ID="project-c25ecdc2-f2e5-412a-a2e"
$REGION="us-central1"
$DB_INSTANCE="justiceai-pg"
$SA_NAME="justice-ai-runner"
$SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

Write-Host "Getting DB connection name..."
$INSTANCE_CONNECTION_NAME = gcloud sql instances describe $DB_INSTANCE --format="value(connectionName)"

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
