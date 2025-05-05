#!/bin/bash

# Script to update SMTP configuration in .env.local
echo "Updating SMTP configuration in .env.local..."

# Ask for SMTP password
read -p "Enter SMTP password for info@movaga.hu: " SMTP_PASSWORD

# Check if .env.local exists
if [ -f .env.local ]; then
  # Check if SMTP settings already exist
  if grep -q "SMTP_HOST" .env.local; then
    echo "SMTP settings already exist in .env.local. Updating..."
    # Update existing settings
    sed -i '' 's/SMTP_HOST=.*/SMTP_HOST=mx03.rackhost.hu/' .env.local
    sed -i '' 's/SMTP_PORT=.*/SMTP_PORT=465/' .env.local
    sed -i '' 's/SMTP_USER=.*/SMTP_USER=info@movaga.hu/' .env.local
    sed -i '' 's/SMTP_PASS=.*/SMTP_PASS='"$SMTP_PASSWORD"'/' .env.local
    sed -i '' 's/SMTP_FROM=.*/SMTP_FROM=info@movaga.hu/' .env.local
  else
    echo "Adding SMTP settings to .env.local..."
    # Add new settings
    cat << EOF >> .env.local

# SMTP Configuration for Order Status Emails
SMTP_HOST=mx03.rackhost.hu
SMTP_PORT=465
SMTP_USER=info@movaga.hu
SMTP_PASS=$SMTP_PASSWORD
SMTP_FROM=info@movaga.hu
EOF
  fi
  echo "SMTP configuration updated successfully in .env.local"
else
  echo "Creating .env.local with SMTP settings..."
  # Create new .env.local file
  cat << EOF > .env.local
# SMTP Configuration for Order Status Emails
SMTP_HOST=mx03.rackhost.hu
SMTP_PORT=465
SMTP_USER=info@movaga.hu
SMTP_PASS=$SMTP_PASSWORD
SMTP_FROM=info@movaga.hu
EOF
  echo "Created .env.local with SMTP settings"
fi

echo "Done. Please restart your Next.js application for changes to take effect." 