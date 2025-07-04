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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User")); // modelo do MongoDB
// Registro de novo usuário
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        // Verificar se o email já está em uso
        const existingUser = yield User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email já está em uso' });
        }
        // Hash da senha
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        // Criar novo usuário no banco
        const newUser = yield User_1.default.create({
            nome: name,
            email,
            senha: hashedPassword,
            role: 'user',
            createdAt: new Date()
        });
        // Gerar token JWT
        const token = jsonwebtoken_1.default.sign({ id: newUser._id, email: newUser.email, role: newUser.role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1d' });
        res.status(201).json({
            message: 'Usuário registrado com sucesso',
            token,
            user: {
                id: newUser._id,
                name: newUser.nome,
                email: newUser.email,
                role: newUser.role
            }
        });
    }
    catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro ao registrar usuário' });
    }
});
exports.register = register;
// Login de usuário
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Buscar usuário no banco
        const user = yield User_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credenciais inválidas' });
        }
        // Verificar senha
        const isMatch = yield bcryptjs_1.default.compare(password, user.senha);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas' });
        }
        // Gerar token JWT
        const token = jsonwebtoken_1.default.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1d' });
        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user._id,
                name: user.nome,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro ao fazer login' });
    }
});
exports.login = login;
// Obter perfil do usuário
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        const user = yield User_1.default.findById(userId).select('-senha');
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Erro ao obter perfil:', error);
        res.status(500).json({ message: 'Erro ao obter perfil' });
    }
});
exports.getProfile = getProfile;
