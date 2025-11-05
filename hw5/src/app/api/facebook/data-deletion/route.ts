import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

/**
 * Facebook Data Deletion Callback
 * 
 * Facebook 會發送 POST 請求到此端點，包含 signed_request 參數
 * 我們需要驗證請求來自 Facebook，然後處理數據刪除請求
 * 
 * 參考：https://developers.facebook.com/docs/apps/delete-data
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const signedRequest = formData.get('signed_request') as string

    if (!signedRequest) {
      return NextResponse.json(
        { error: '缺少 signed_request 參數' },
        { status: 400 }
      )
    }

    // 驗證 signed_request（簡化版本）
    // 在生產環境中，應該使用 Facebook 的 App Secret 來驗證
    const facebookAppSecret = process.env.FACEBOOK_CLIENT_SECRET

    if (!facebookAppSecret) {
      console.error('FACEBOOK_CLIENT_SECRET 未設定')
      return NextResponse.json(
        { error: '伺服器設定錯誤' },
        { status: 500 }
      )
    }

    // 解析 signed_request
    const [encodedSig, payload] = signedRequest.split('.', 2)
    
    if (!encodedSig || !payload) {
      return NextResponse.json(
        { error: 'signed_request 格式錯誤' },
        { status: 400 }
      )
    }
    
    // 驗證簽名：計算 HMAC-SHA256
    const expectedSig = crypto
      .createHmac('sha256', facebookAppSecret)
      .update(payload)
      .digest('base64url')

    // 比較簽名（都應該是 base64url 編碼）
    if (encodedSig !== expectedSig) {
      // 在開發環境中，如果驗證失敗，仍然允許繼續（方便測試）
      // 在生產環境中應該嚴格驗證
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: '簽名驗證失敗' },
          { status: 401 }
        )
      }
      console.warn('Facebook 簽名驗證失敗，但在開發環境中允許繼續')
    }

    // 解析 payload
    const decodedPayload = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf-8')
    )

    const { user_id } = decodedPayload

    if (!user_id) {
      return NextResponse.json(
        { error: '缺少 user_id' },
        { status: 400 }
      )
    }

    // 查找對應的 Facebook Account
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'facebook',
          providerAccountId: user_id,
        },
      },
      include: {
        user: true,
      },
    })

    if (!account) {
      // 如果找不到用戶，仍然返回成功（符合 Facebook 要求）
      return NextResponse.json({
        url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/delete-account`,
        confirmation_code: user_id,
      })
    }

    // 刪除用戶及其所有相關數據
    await prisma.user.delete({
      where: { id: account.userId },
    })

    // 返回確認代碼和刪除頁面 URL
    return NextResponse.json({
      url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/delete-account`,
      confirmation_code: user_id,
    })
  } catch (error) {
    console.error('Facebook 數據刪除回調錯誤:', error)
    
    // 即使發生錯誤，也返回標準格式的響應（符合 Facebook 要求）
    return NextResponse.json(
      {
        url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/delete-account`,
        confirmation_code: 'error',
      },
      { status: 200 }
    )
  }
}

// Facebook 可能會發送 GET 請求來驗證端點
export async function GET() {
  return NextResponse.json({
    message: 'Facebook Data Deletion Callback Endpoint',
    url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/delete-account`,
  })
}

