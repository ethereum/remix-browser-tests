# Step 1: Generate a Private Key
openssl genrsa -out mysite.key 2048

# Step 2: Create a Certificate Signing Request (CSR)
openssl req -new -x509 -days 365 -key mysite.key -out mysite.crt -subj "/C=US/ST=YourState/L=YourCity/O=YourOrganization/OU=YourUnit/CN=jqgt.remixproject.org"

