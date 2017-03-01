#!/usr/bin/env bash -e

################ Extract arguments ################
USE_WML=
KEEP_NODE_MODULES=


while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    -k|--keep-node-modules)
    KEEP_NODE_MODULES=true
    ;;
    --use-wml)
    USE_WML=true
    ;;
    *)
        # unknown option
    ;;
esac
shift # past argument or value
done


cd `dirname $0`

if [ ${KEEP_NODE_MODULES} != true ]
then
    printf "\e[35m%b\e[0m\n" "delete node_modules folder"
    rm -rf ../../node_modules/
fi


./npm-link-modules.sh ${USE_WML:+"--use-wml"}

if [ $USE_WML ]
then
    $(npm bin)/wml once
fi