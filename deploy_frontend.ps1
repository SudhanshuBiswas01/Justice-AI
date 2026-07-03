$ErrorActionPreference = "Stop"

$PROJECT_ID="project-c25ecdc2-f2e5-412a-a2e"
$REGION="us-central1"
$DB_INSTANCE="justiceai-pg"
$SA_NAME="justice-ai-runner"
$SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

Write-Host "Getting DB connection name..."
$INSTANCE_CONNECTION_NAME = gcloud sql instances describe $DB_INSTANCE --format="value(connectionName)"

Write-Host "Building and Pushing Frontend Image..."
gcloud builds submit frontend --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/justice-ai-repo/frontend:latest"

$BACKEND_URL = "https://justice-ai-backend-feoj4fhk2a-uc.a.run.app"

Write-Host "Deploying Frontend to Cloud Run..."
gcloud run deploy justice-ai-frontend `
  --image "${REGION}-docker.pkg.dev/${PROJECT_ID}/justice-ai-repo/frontend:latest" `
  --region $REGION `
  --service-account $SA_EMAIL `
  --add-cloudsql-instances $INSTANCE_CONNECTION_NAME `
  --set-env-vars NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL `
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,NEXTAUTH_URL=NEXTAUTH_URL:latest" `
  --allow-unauthenticated `
  --min-instances 0 `
  --max-instances 5

$FRONTEND_URL = gcloud run services describe justice-ai-frontend --region=$REGION --format="value(status.url)"
Write-Host "Frontend URL: $FRONTEND_URL"

Write-Host "Frontend Deployment Completed Successfully!"
