#!/bin/bash
source ~/.bashrc
GITSHA=$(git rev-parse --short HEAD)

case "$1" in
    container)
        sudo -u dooshima2020£ docker build -t adderservice:$GITSHA .
        sudo -u dooshima2020£ docker tag adderservice:$GITSHA madjava/adderservice:$GITSHA
        sudo -i -u dooshima2020£ docker push madjava/adderservice:$GITSHA
    ;;
    deploy)
        sed -e s/_NAME_/adderservice/ -e s/_PORT_/8081/ < ../deployment/service-template.yml > svc.yml
        sed -e s/_NAME_/adderservice/ -e s/_PORT_/8081/ -e s/_IMAGE_/madjava\\/adderservice:$GITSHA/ < ../deployment/deployment-template.yml > dep.yml
        sudo -i -u madjava kubectl apply -f $(pwd)/svc.yml
        sudo -i -u madjava kubectl apply -f $(pwd)/dep.yml
    ;;
    *)
    echo invalid build step
    exit 1
    ;;
esac