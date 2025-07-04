import { Request, Response } from 'express';

// Mock de usuários para desenvolvimento
const users = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@exemplo.com',
    password: '$2a$10$X7.H/XqZXbW.1XxZ9QxZ3O5C3L8h.UB1YQ5aK5B5XvhVzOFDxPFTO', // "senha123"
    role: 'user',
    createdAt: new Date()
  }
];

// Obter todos os usuários (apenas para admin)
export const getUsers = async (req: Request, res: Response) => {
  try {
    // Em uma implementação real, verificaríamos se o usuário é admin
    // e buscaríamos do banco de dados
    
    // Retornar usuários sem as senhas
    const usersWithoutPasswords = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }));

    res.json({ users: usersWithoutPasswords });
  } catch (error) {
    console.error('Erro ao obter usuários:', error);
    res.status(500).json({ message: 'Erro ao obter usuários' });
  }
};

// Obter um usuário específico
export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = users.find(user => user.id === id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Retornar usuário sem a senha
    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ message: 'Erro ao obter usuário' });
  }
};

// Atualizar um usuário
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Atualizar usuário
    users[userIndex] = {
      ...users[userIndex],
      name: name || users[userIndex].name,
      email: email || users[userIndex].email
    };

    // Retornar usuário atualizado sem a senha
    const userWithoutPassword = {
      id: users[userIndex].id,
      name: users[userIndex].name,
      email: users[userIndex].email,
      role: users[userIndex].role,
      createdAt: users[userIndex].createdAt
    };

    res.json({ 
      message: 'Usuário atualizado com sucesso',
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuário' });
  }
};

// Excluir um usuário
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Remover usuário
    users.splice(userIndex, 1);

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ message: 'Erro ao excluir usuário' });
  }
};
