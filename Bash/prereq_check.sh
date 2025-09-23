#!/bin/bash

REQUIRED_PACKAGES="git curl docker-ce vim wget"

for PACKAGE in $REQUIRED_PACKAGES; do
  if command -v $PACKAGE >/dev/null 2>&1; then
    echo "$PACKAGE is installed"
  else
    echo "$PACKAGE is not installed"
  fi
done
 
