import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

// Middleware para verificar autenticação
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obter token do cabeçalho
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Acesso não autorizado. Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey') as DecodedToken;
    
    // Adicionar usuário à requisição
    (req as any).user = decoded;
    
    next();
  } catch (error) {
    console.error('Erro de autenticação:', error);
    res.status(401).json({ message: 'Acesso não autorizado. Token inválido.' });
  }
};

// Middleware para verificar permissões de admin
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso proibido. Permissão de administrador necessária.' });
    }
    
    next();
  } catch (error) {
    console.error('Erro de autorização:', error);
    res.status(403).json({ message: 'Acesso proibido.' });
  }
};
