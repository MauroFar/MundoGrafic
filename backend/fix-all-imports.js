const fs = require('fs');
const path = require('path');

// Función para procesar un archivo
function processFile(filePath) {
  console.log(`Procesando: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Reemplazar requires por imports
  content = content.replace(/const express = require\(['"]express['"]\);?/g, 'import express from "express";');
  content = content.replace(/const cors = require\(['"]cors['"]\);?/g, 'import cors from "cors";');
  content = content.replace(/const path = require\(['"]path['"]\);?/g, 'import path from "path";');
  content = content.replace(/const fs = require\(['"]fs['"]\);?/g, 'import fs from "fs";');
  content = content.replace(/const fs = require\(['"]fs['"]\)\.promises;?/g, 'import fs from "fs/promises";');
  content = content.replace(/const { Client } = require\(['"]pg['"]\);?/g, 'import { Client } from "pg";');
  content = content.replace(/const bcrypt = require\(['"]bcryptjs['"]\);?/g, 'import bcrypt from "bcryptjs";');
  content = content.replace(/const jwt = require\(['"]jsonwebtoken['"]\);?/g, 'import jwt from "jsonwebtoken";');
  content = content.replace(/const multer = require\(['"]multer['"]\);?/g, 'import multer from "multer";');
  content = content.replace(/const nodemailer = require\(['"]nodemailer['"]\);?/g, 'import nodemailer from "nodemailer";');
  content = content.replace(/const puppeteer = require\(['"]puppeteer['"]\);?/g, 'import puppeteer from "puppeteer";');
  content = content.replace(/const sharp = require\(['"]sharp['"]\);?/g, 'import sharp from "sharp";');
  content = content.replace(/const os = require\(['"]os['"]\);?/g, 'import os from "os";');
  content = content.replace(/const dotenv = require\(['"]dotenv['"]\);?/g, 'import dotenv from "dotenv";');
  
  // Reemplazar requires locales
  content = content.replace(/const (\w+) = require\(['"]\.\/([^'"]+)['"]\);?/g, 'import $1 from "./$2";');
  content = content.replace(/const (\w+) = require\(['"]\.\.\/([^'"]+)['"]\);?/g, 'import $1 from "../$2";');
  
  // Reemplazar module.exports por export default
  content = content.replace(/module\.exports = /g, 'export default ');
  content = content.replace(/module\.exports = function/g, 'export default function');
  
  // Agregar tipos básicos para parámetros
  content = content.replace(/function\s+(\w+)\s*\(([^)]*)\)/g, 'function $1($2: any)');
  content = content.replace(/\(client\)\s*=>/g, '(client: any) =>');
  content = content.replace(/\(req,\s*res\)\s*=>/g, '(req: any, res: any) =>');
  content = content.replace(/\(req,\s*res,\s*next\)\s*=>/g, '(req: any, res: any, next: any) =>');
  content = content.replace(/async\s+\(req,\s*res\)\s*=>/g, 'async (req: any, res: any) =>');
  content = content.replace(/async\s+\(req,\s*res,\s*next\)\s*=>/g, 'async (req: any, res: any, next: any) =>');
  
  // Agregar tipos para variables de error
  content = content.replace(/catch\s*\((\w+)\)/g, 'catch ($1: any)');
  
  // Escribir el archivo modificado
  fs.writeFileSync(filePath, content, 'utf8');
}

// Función para procesar directorio recursivamente
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts')) {
      processFile(filePath);
    }
  });
}

// Procesar el directorio src
console.log('🚀 Corrigiendo imports en archivos TypeScript...');
processDirectory('./src');
console.log('✅ Imports corregidos!');
