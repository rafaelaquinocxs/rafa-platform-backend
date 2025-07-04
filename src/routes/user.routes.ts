import express from 'express';
import { getUsers, getUser, updateUser, deleteUser } from '../controllers/user.controller';

const router = express.Router();

// Rotas de usuários
router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
