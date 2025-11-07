'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Box, CircularProgress, Alert, IconButton, Paper, Button, Avatar, Typography } from '@mui/material'
import TextField from '@mui/material/TextField'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SendIcon from '@mui/icons-material/Send'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import PostCard from '@/components/PostCard'
import CommentCard from '@/components/CommentCard'
import { useComments, useReplies, useToggleLike, useToggleRepost, useToggleCommentRepost, useCreateComment, useCreateReply } from '@/hooks'
import { useSession } from 'next-auth/react'
import { Post, Comment } from '@/types'
import MentionInput from '@/components/MentionInput'
import { calculateEffectiveLength } from '@/utils/mention'

export default function PostDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const postId = params.postId as string
  const commentId = searchParams.get('commentId')
  const { data: session } = useSession()
  const toggleLike = useToggleLike()
  const toggleRepost = useToggleRepost()
  const toggleCommentRepost = useToggleCommentRepost()
  const [commentContent, setCommentContent] = useState('')
  const createComment = useCreateComment()
  const createReply = useCreateReply()

  const handleLike = (postId: string) => {
    toggleLike.mutate(postId)
  }

  const handleRepost = (targetId: string, options?: { isComment?: boolean }) => {
    if (options?.isComment) {
      toggleCommentRepost.mutate(targetId)
    } else {
      toggleRepost.mutate(targetId)
    }
  }

  // 查詢貼文
  const { data: post, isLoading: isPostLoading, error: postError } = useQuery<Post>({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/posts/${postId}`)
      return data.post as Post
    },
    enabled: !!postId,
  })

  // 查詢頂層留言（當沒有 commentId 時）
  const { data: comments, isLoading: isCommentsLoading, error: commentsError } = useComments(
    commentId ? '' : postId
  )

  // 查詢回覆（當有 commentId 時）
  const { data: replies, isLoading: isRepliesLoading, error: repliesError } = useReplies(
    commentId || ''
  )

  // 查詢父留言（當有 commentId 時）
  const { data: parentComment } = useQuery<Comment | null>({
    queryKey: ['comment', commentId],
    queryFn: async () => {
      if (!commentId) return null
      const { data } = await axios.get(`/api/comments/${commentId}`)
      return data.comment as Comment
    },
    enabled: !!commentId,
  })

  const handleBack = () => {
    if (commentId) {
      router.push(`/posts/${postId}`)
    } else {
      router.push('/')
    }
  }


  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!commentContent.trim() || !postId) return

    try {
      if (commentId) {
        await createReply.mutateAsync({ commentId, content: commentContent.trim(), postId })
      } else {
        await createComment.mutateAsync({ postId, content: commentContent.trim() })
      }
      setCommentContent('')
    } catch (error) {
      console.error('Failed to create comment:', error)
    }
  }

  if (isPostLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (postError || !post) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">
          Failed to load post
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
        <IconButton onClick={handleBack} sx={{ mb: 1 }}>
          <ArrowBackIcon />
        </IconButton>

        {!commentId && (
          <>
            <PostCard post={post} onLike={handleLike} onRepost={handleRepost} />
            
            {session && (
              <Paper sx={{ p: 2, mb: 2, backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Box component="form" onSubmit={handleSubmitComment} display="flex" gap={2}>
                  <Avatar src={session.user?.image || ''}>
                    {session.user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box flex={1}>
                    <MentionInput
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Post your reply"
                      value={commentContent}
                      onChange={setCommentContent}
                      variant="standard"
                      sx={{ mb: 1 }}
                      inputProps={{ maxLength: 280 }}
                    />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography 
                        variant="caption" 
                        color={calculateEffectiveLength(commentContent) > 280 ? 'error' : 'text.secondary'}
                      >
                        {calculateEffectiveLength(commentContent)}/280
                      </Typography>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={
                          !commentContent.trim() ||
                          calculateEffectiveLength(commentContent) > 280 ||
                          createComment.isPending
                        }
                        startIcon={<SendIcon />}
                      >
                        Reply
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            )}

            {isCommentsLoading && (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            )}

            {commentsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to load comments
              </Alert>
            )}

            {comments && comments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} postId={postId} />
            ))}
          </>
        )}

        {commentId && (
          <>
            {parentComment && (
              <CommentCard comment={parentComment} postId={postId} clickable={false} />
            )}

            {session && (
              <Paper sx={{ p: 2, mb: 2, backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Box component="form" onSubmit={handleSubmitComment} display="flex" gap={2}>
                  <Avatar src={session.user?.image || ''}>
                    {session.user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box flex={1}>
                    <MentionInput
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Post your reply"
                      value={commentContent}
                      onChange={setCommentContent}
                      variant="standard"
                      sx={{ mb: 1 }}
                      inputProps={{ maxLength: 280 }}
                    />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography
                        variant="caption"
                        color={calculateEffectiveLength(commentContent) > 280 ? 'error' : 'text.secondary'}
                      >
                        {calculateEffectiveLength(commentContent)}/280
                      </Typography>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={
                          !commentContent.trim() ||
                          calculateEffectiveLength(commentContent) > 280 ||
                          createReply.isPending
                        }
                        startIcon={<SendIcon />}
                      >
                        Reply
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            )}

            {isRepliesLoading && (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            )}

            {repliesError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to load replies
              </Alert>
            )}

            {replies && replies.map((reply) => (
              <CommentCard key={reply.id} comment={reply} postId={postId} />
            ))}
          </>
        )}
      </Container>
  )
}

