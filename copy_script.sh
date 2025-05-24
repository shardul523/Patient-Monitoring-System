#!/bin/bash

# Copy shared utils to each service
cp -r ./shared/utils ./services/api-gateway/src/
cp -r ./shared/utils ./services/patient-service/src/
cp -r ./shared/utils ./services/vital-signs-service/src/
cp -r ./shared/utils ./services/alert-service/src
