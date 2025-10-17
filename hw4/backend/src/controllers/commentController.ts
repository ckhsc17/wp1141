import { Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/commentService';
import { AuthenticatedRequest, CreateCommentDTO } from '../types';

const commentService = new CommentService();

/**
 * @swagger
 * /api/treasures/{treasureId}/comments:
 *   post:
 *     summary: Create a new comment for a treasure
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: treasureId
 *         required: true
 *         schema:
 *           type: string
 *         description: Treasure ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentDTO'
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CommentDTO'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Treasure not found
 */
export const createComment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { treasureId } = req.params;
    const commentData: CreateCommentDTO = req.body;
    const userId = req.user!.id;

    const result = await commentService.createComment(treasureId, commentData, userId);

    if (!result.success) {
      return res.status(result.error === 'Treasure not found' ? 404 : 400).json({
        success: false,
        error: result.error,
        message: result.error
      });
    }

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Comment created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/treasures/{treasureId}/comments:
 *   get:
 *     summary: Get comments for a treasure
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: treasureId
 *         required: true
 *         schema:
 *           type: string
 *         description: Treasure ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of comments per page
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         comments:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/CommentDTO'
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */
export const getCommentsByTreasureId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { treasureId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await commentService.getCommentsByTreasureId(treasureId, page, limit);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data,
      message: 'Comments retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/comments/{commentId}:
 *   get:
 *     summary: Get a specific comment by ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CommentDTO'
 *       404:
 *         description: Comment not found
 */
export const getCommentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { commentId } = req.params;

    const result = await commentService.getCommentById(commentId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error,
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data,
      message: 'Comment retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/comments/{commentId}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Updated comment content
 *             required:
 *               - content
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CommentDTO'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to update this comment
 *       404:
 *         description: Comment not found
 */
export const updateComment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content is required and must be a non-empty string',
        message: 'Content is required and must be a non-empty string'
      });
    }

    const result = await commentService.updateComment(commentId, content.trim(), userId);

    if (!result.success) {
      const statusCode = result.error === 'Comment not found' ? 404 :
                        result.error === 'Not authorized to update this comment' ? 403 : 400;
      
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data,
      message: 'Comment updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to delete this comment
 *       404:
 *         description: Comment not found
 */
export const deleteComment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { commentId } = req.params;
    const userId = req.user!.id;

    const result = await commentService.deleteComment(commentId, userId);

    if (!result.success) {
      const statusCode = result.error === 'Comment not found' ? 404 :
                        result.error === 'Not authorized to delete this comment' ? 403 : 400;
      
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};