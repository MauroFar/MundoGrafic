"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var pg_1 = require("pg");
console.log('🚀 Iniciando prueba de conexión a base de datos...');
// Configuración directa (sin .env)
var config = {
    user: 'postgres',
    host: 'localhost',
    database: 'sistema_mg',
    password: '2024Asdaspro@',
    port: 5432,
};
console.log('📋 Configuración de conexión:');
console.log("   Host: ".concat(config.host));
console.log("   Puerto: ".concat(config.port));
console.log("   Base de datos: ".concat(config.database));
console.log("   Usuario: ".concat(config.user));
function testConnection() {
    return __awaiter(this, void 0, void 0, function () {
        var client, result, userResult, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = new pg_1.Client(config);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 8]);
                    console.log('🔌 Intentando conectar a PostgreSQL...');
                    return [4 /*yield*/, client.connect()];
                case 2:
                    _a.sent();
                    console.log('✅ Conexión exitosa a PostgreSQL!');
                    // Probar consulta simple
                    console.log('🧪 Probando consulta simple...');
                    return [4 /*yield*/, client.query('SELECT version()')];
                case 3:
                    result = _a.sent();
                    console.log('📊 Versión de PostgreSQL:', result.rows[0].version);
                    // Probar consulta a tabla específica
                    console.log('🧪 Probando consulta a tabla usuarios...');
                    return [4 /*yield*/, client.query('SELECT COUNT(*) as total FROM usuarios')];
                case 4:
                    userResult = _a.sent();
                    console.log('👥 Total de usuarios:', userResult.rows[0].total);
                    console.log('🎉 Todas las pruebas pasaron exitosamente!');
                    return [3 /*break*/, 8];
                case 5:
                    error_1 = _a.sent();
                    console.error('❌ Error durante la prueba:');
                    console.error('   Tipo de error:', error_1.constructor.name);
                    console.error('   Mensaje:', error_1.message);
                    if (error_1.stack) {
                        console.error('   Stack:', error_1.stack);
                    }
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, client.end()];
                case 7:
                    _a.sent();
                    console.log('🔌 Conexión cerrada.');
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// Ejecutar la prueba
testConnection().catch(function (error) {
    console.error('💥 Error fatal:', error);
    process.exit(1);
});
console.log('⏳ Ejecutando prueba...');
