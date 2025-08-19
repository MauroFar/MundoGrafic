#!/bin/bash

echo "🔧 Corrigiendo imports después de la migración..."

# Función para reemplazar imports en un archivo
fix_imports_in_file() {
    local file="$1"
    echo "Corrigiendo imports en: $file"
    
    # Reemplazar require por import
    sed -i 's/const express = require("express");/import express from "express";/g' "$file"
    sed -i 's/const cors = require("cors");/import cors from "cors";/g' "$file"
    sed -i 's/const path = require("path");/import path from "path";/g' "$file"
    sed -i 's/const fs = require("fs");/import fs from "fs";/g' "$file"
    sed -i 's/const { Client } = require("pg");/import { Client } from "pg";/g' "$file"
    sed -i 's/const bcrypt = require("bcryptjs");/import bcrypt from "bcryptjs";/g' "$file"
    sed -i 's/const jwt = require("jsonwebtoken");/import jwt from "jsonwebtoken";/g' "$file"
    sed -i 's/const multer = require("multer");/import multer from "multer";/g' "$file"
    sed -i 's/const nodemailer = require("nodemailer");/import nodemailer from "nodemailer";/g' "$file"
    sed -i 's/const puppeteer = require("puppeteer");/import puppeteer from "puppeteer";/g' "$file"
    sed -i 's/const sharp = require("sharp");/import sharp from "sharp";/g' "$file"
    
    # Reemplazar module.exports por export default
    sed -i 's/module.exports = /export default /g' "$file"
    
    # Reemplazar require de archivos locales
    sed -i 's/const \(.*\) = require("\.\/\(.*\)");/import \1 from ".\/\2";/g' "$file"
    sed -i 's/const \(.*\) = require("\.\.\/\(.*\)");/import \1 from "..\/\2";/g' "$file"
}

# Aplicar correcciones a todos los archivos .ts
find src -name "*.ts" -type f | while read file; do
    fix_imports_in_file "$file"
done

echo "✅ Imports corregidos!"
echo "⚠️  Revisa manualmente los archivos para asegurar que todos los imports estén correctos"
