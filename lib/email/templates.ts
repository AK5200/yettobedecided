export function statusChangeEmail(data: {
  postTitle: string
  oldStatus: string
  newStatus: string
  boardName: string
  orgName: string
  postUrl: string
}) {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Status Update</h2>
      <p>Your feedback <strong>${data.postTitle}</strong> has been updated.</p>
      <p>Status: <strong>${data.oldStatus}</strong> → <strong>${data.newStatus}</strong></p>
      <p>Board: ${data.boardName} • ${data.orgName}</p>
      <a href="${data.postUrl}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">View Post</a>
    </div>`
}

export function newCommentEmail(data: {
  postTitle: string
  commenterName: string
  commentContent: string
  postUrl: string
}) {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Comment</h2>
      <p><strong>${data.commenterName}</strong> commented on <strong>${data.postTitle}</strong></p>
      <blockquote style="border-left: 3px solid #ccc; padding-left: 12px; margin: 16px 0;">${data.commentContent}</blockquote>
      <a href="${data.postUrl}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">View Comment</a>
    </div>`
}

export function newFeedbackEmail(data: {
  postTitle: string
  postContent: string
  authorName: string
  boardName: string
  postUrl: string
}) {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Feedback Received</h2>
      <p><strong>${data.authorName || 'Someone'}</strong> submitted feedback to <strong>${data.boardName}</strong></p>
      <h3>${data.postTitle}</h3>
      <p>${data.postContent || 'No description'}</p>
      <a href="${data.postUrl}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">Review Feedback</a>
    </div>`
}

export function teamInviteEmail(data: {
  orgName: string
  inviterName: string
  role: string
  inviteUrl: string
}) {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You're Invited!</h2>
      <p><strong>${data.inviterName}</strong> invited you to join <strong>${data.orgName}</strong> as a ${data.role}.</p>
      <a href="${data.inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">Accept Invitation</a>
      <p style="margin-top: 16px; color: #666; font-size: 14px;">This invitation expires in 7 days.</p>
    </div>`
}

export function passwordResetEmail(data: { resetUrl: string }) {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>Click the button below to reset your password.</p>
      <a href="${data.resetUrl}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">Reset Password</a>
      <p style="margin-top: 16px; color: #666; font-size: 14px;">If you didn't request this, ignore this email.</p>
    </div>`
}

export function magicLinkCodeEmail(data: { code: string; orgName: string }) {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your verification code</h2>
      <p>Use the following code to sign in to ${data.orgName}:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 24px; background: #f4f4f5; border-radius: 8px; margin: 24px 0;">${data.code}</div>
      <p style="color: #666; font-size: 14px;">This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>`
}
