import { Container, Paper, Typography, Box, Divider } from '@mui/material'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '隱私政策 | Echoo',
  description: 'Echoo 隱私政策聲明',
}

export default function PrivacyPolicy() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          隱私政策
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          最後更新日期：{new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            1. 資訊收集
          </Typography>
          <Typography variant="body1" paragraph>
            當您使用 Echoo 服務時，我們可能會收集以下資訊：
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>透過 OAuth 提供者（Google、GitHub、Facebook）提供的帳號資訊，包括姓名、電子郵件地址和個人資料圖片</li>
            <li>您主動提供的內容，包括貼文、評論、個人資料資訊</li>
            <li>使用資料，包括您與服務的互動方式、瀏覽的頁面和點擊的連結</li>
            <li>技術資訊，包括 IP 位址、瀏覽器類型和裝置資訊</li>
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            2. 資訊使用
          </Typography>
          <Typography variant="body1" paragraph>
            我們使用收集的資訊來：
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>提供、維護和改進我們的服務</li>
            <li>處理您的註冊並管理您的帳號</li>
            <li>向您發送通知和更新（根據您的偏好設定）</li>
            <li>回應您的請求、問題和意見</li>
            <li>偵測、預防和處理技術問題或安全問題</li>
            <li>遵守法律義務和保護我們的權利</li>
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            3. 資訊分享
          </Typography>
          <Typography variant="body1" paragraph>
            我們不會出售、交易或租賃您的個人資訊給第三方。我們可能會在以下情況下分享您的資訊：
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>經過您的明確同意</li>
            <li>為了遵守法律義務、法規或政府要求</li>
            <li>為了保護我們的權利、財產或安全，或保護其他使用者的權利、財產或安全</li>
            <li>在業務轉移的情況下（如合併、收購或資產出售）</li>
            <li>與服務提供者分享，這些提供者協助我們營運服務（受嚴格保密協議約束）</li>
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            4. 資料安全
          </Typography>
          <Typography variant="body1" paragraph>
            我們採取適當的技術和組織措施來保護您的個人資訊，防止未經授權的訪問、使用、披露、更改或破壞。然而，沒有任何方法可以保證 100% 的安全性。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            5. 您的權利
          </Typography>
          <Typography variant="body1" paragraph>
            根據適用的資料保護法律，您有權：
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>訪問、更正或刪除您的個人資訊</li>
            <li>反對或限制我們處理您的個人資訊</li>
            <li>資料可攜性權利</li>
            <li>撤回同意（如果我們基於同意處理您的資訊）</li>
            <li>向監管機構提出投訴</li>
          </Typography>
          <Typography variant="body1" paragraph>
            如需行使這些權利，請透過應用程式內的聯絡方式與我們聯繫。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            5.1 資料刪除請求
          </Typography>
          <Typography variant="body1" paragraph>
            您有權隨時要求刪除您的帳號和所有相關資料。刪除您的帳號將永久刪除：
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>您的個人資料資訊（姓名、電子郵件、個人簡介等）</li>
            <li>您發布的所有貼文</li>
            <li>您的所有評論和回覆</li>
            <li>您的按讚記錄</li>
            <li>您的草稿</li>
            <li>您的追蹤和粉絲關係</li>
            <li>您的提及通知</li>
            <li>所有其他與您帳號相關的資料</li>
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>如何刪除您的資料：</strong>
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>登入您的帳號後，前往 <Link href="/delete-account" style={{ textDecoration: 'none' }}>資料刪除頁面</Link> 提交刪除請求</li>
            <li>確認您的身份並確認刪除操作（此操作無法復原）</li>
            <li>系統將立即刪除您的所有資料</li>
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Facebook 用戶：</strong>如果您使用 Facebook 登入，您也可以透過 Facebook 的帳號設定頁面請求刪除資料。
            我們會透過 <Link href="/api/facebook/data-deletion" target="_blank" style={{ textDecoration: 'none' }}>Facebook 資料刪除回調端點</Link> 處理來自 Facebook 的資料刪除請求。
          </Typography>
          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            <strong>注意：</strong>資料刪除是永久性的，無法復原。請在刪除前確認您已備份任何想要保留的資訊。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            6. Cookie 和追蹤技術
          </Typography>
          <Typography variant="body1" paragraph>
            我們使用 Cookie 和類似的追蹤技術來追蹤您在我們服務上的活動，並保存某些資訊。您可以透過瀏覽器設定來控制 Cookie，但這可能會影響某些功能的可用性。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            7. 第三方服務
          </Typography>
          <Typography variant="body1" paragraph>
            我們的服務整合了第三方服務（如 OAuth 提供者），這些服務有自己的隱私政策。我們建議您閱讀這些第三方的隱私政策，以了解他們如何收集、使用和分享您的資訊。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            8. 兒童隱私
          </Typography>
          <Typography variant="body1" paragraph>
            我們的服務不針對 13 歲以下的兒童。我們不會故意收集 13 歲以下兒童的個人資訊。如果我們發現收集了此類資訊，我們將立即刪除。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            9. 隱私政策變更
          </Typography>
          <Typography variant="body1" paragraph>
            我們可能會不時更新本隱私政策。我們將透過在服務上發布新的隱私政策並更新「最後更新日期」來通知您任何變更。建議您定期查看本隱私政策以了解任何變更。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            10. 聯絡我們
          </Typography>
          <Typography variant="body1" paragraph>
            如果您對本隱私政策有任何問題或疑慮，請透過應用程式內的聯絡方式與我們聯繫。
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
              返回首頁
            </Typography>
          </Link>
        </Box>
      </Paper>
    </Container>
  )
}

