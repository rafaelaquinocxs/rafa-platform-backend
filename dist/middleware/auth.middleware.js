"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Middleware para verificar autenticação
const authMiddleware = (req, res, next) => {
    try {
        // Obter token do cabeçalho
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Acesso não autorizado. Token não fornecido.' });
        }
        const token = authHeader.split(' ')[1];
        // Verificar token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secretkey');
        // Adicionar usuário à requisição
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('Erro de autenticação:', error);
        res.status(401).json({ message: 'Acesso não autorizado. Token inválido.' });
    }
};
exports.authMiddleware = authMiddleware;
// Middleware para verificar permissões de admin
const adminMiddleware = (req, res, next) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Acesso proibido. Permissão de administrador necessária.' });
        }
        next();
    }
    catch (error) {
        console.error('Erro de autorização:', error);
        res.status(403).json({ message: 'Acesso proibido.' });
    }
};
exports.adminMiddleware = adminMiddleware;
