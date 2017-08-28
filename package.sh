#!/usr/bin/env bash

set -e

cd ./build/release/magneto/

if [ -d magneto-linux32 ]; then
    rm -rf magneto-linux32
fi
if [ -d magneto-linux64 ]; then
    rm -rf magneto-linux64
fi
if [ -d magneto-win32 ]; then
    rm -rf magneto-win32
fi
if [ -d magneto-win64 ]; then
    rm -rf magneto-win64
fi
if [ -d magneto-osx64 ]; then
    rm -rf magneto-osx64
fi

mv linux32 magneto-linux32
mv linux64 magneto-linux64
mv win32 magneto-win32
mv win64 magneto-win64
mv osx64 magneto-osx64

if [ -f magneto-linux32.tar.gz ]; then
    rm magneto-linux32.tar.gz
fi
if [ -f magneto-linux64.tar.gz ]; then
    rm magneto-linux64.tar.gz
fi
if [ -f magneto-win32.zip ]; then
    rm magneto-win32.zip
fi
if [ -f magneto-win64.zip ]; then
    rm magneto-win64.zip
fi
if [ -f magneto-osx64.zip ]; then
    rm magneto-osx64.zip
fi

env GZIP=-9 tar czvf magneto-linux32.tar.gz magneto-linux32
env GZIP=-9 tar czvf magneto-linux64.tar.gz magneto-linux64
zip -r9 magneto-win32.zip magneto-win32
zip -r9 magneto-win64.zip magneto-win64
zip -r9y magneto-osx64.zip magneto-osx64

echo "Packages done!";
