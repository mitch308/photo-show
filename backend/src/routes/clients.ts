import { Router, Request, Response } from 'express';
import { clientService, CreateClientData, UpdateClientData } from '../services/clientService.js';
import { successResponse, errorResponse, ErrorCodes } from '../types/response.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/clients
 * List clients with optional search
 * Per CLNT-01: 管理员可以添加和管理客户信息
 * 
 * Query params:
 * - search: string (searches name, email, phone, company)
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, limit, offset } = req.query;

    const options = {
      search: search as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    };

    const result = await clientService.listClients(options);
    res.json(successResponse(result));
  } catch (error: any) {
    console.error('Error in GET /api/clients:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/clients/:id
 * Get a single client
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const client = await clientService.getClientById(id);

    if (!client) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '客户不存在'));
      return;
    }

    res.json(successResponse(client));
  } catch (error: any) {
    console.error('Error in GET /api/clients/:id:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * POST /api/clients
 * Create a new client
 * Per CLNT-01: 管理员可以添加和管理客户信息
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreateClientData = req.body;

    // Validate required fields
    if (!data.name) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'name 是必填字段'));
      return;
    }

    // Parse birthday if provided as string
    if (data.birthday && typeof data.birthday === 'string') {
      data.birthday = new Date(data.birthday);
    }

    const client = await clientService.createClient(data);
    res.status(201).json(successResponse(client, '客户创建成功'));
  } catch (error: any) {
    console.error('Error in POST /api/clients:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * PUT /api/clients/:id
 * Update a client
 * Per CLNT-04: 管理员可以编辑和删除客户信息
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data: UpdateClientData = req.body;

    // Parse birthday if provided as string
    if (data.birthday !== undefined && data.birthday !== null && typeof data.birthday === 'string') {
      data.birthday = new Date(data.birthday);
    }

    const client = await clientService.updateClient(id, data);

    if (!client) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '客户不存在'));
      return;
    }

    res.json(successResponse(client, '客户更新成功'));
  } catch (error: any) {
    console.error('Error in PUT /api/clients/:id:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * DELETE /api/clients/:id
 * Delete a client
 * Per CLNT-04: 管理员可以编辑和删除客户信息
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const deleted = await clientService.deleteClient(id);

    if (!deleted) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '客户不存在'));
      return;
    }

    res.json(successResponse(null, '客户删除成功'));
  } catch (error: any) {
    console.error('Error in DELETE /api/clients/:id:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/clients/:id/shares
 * Get shares for a client
 * Per CLNT-02: 管理员可以为客户创建专属的私密链接
 */
router.get('/:id/shares', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Verify client exists
    const client = await clientService.getClientById(id);
    if (!client) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '客户不存在'));
      return;
    }

    const shares = await clientService.getClientShares(id);
    res.json(successResponse(shares));
  } catch (error: any) {
    console.error('Error in GET /api/clients/:id/shares:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/clients/:id/access-logs
 * Get access logs for a client
 * Per CLNT-03: 管理员可以查看每个客户的访问历史
 * 
 * Query params:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
router.get('/:id/access-logs', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { limit, offset } = req.query;

    // Verify client exists
    const client = await clientService.getClientById(id);
    if (!client) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '客户不存在'));
      return;
    }

    const options = {
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    };

    const result = await clientService.getClientAccessLogs(id, options);
    res.json(successResponse(result));
  } catch (error: any) {
    console.error('Error in GET /api/clients/:id/access-logs:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

export default router;