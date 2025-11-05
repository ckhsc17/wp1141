import { Container, Paper, Typography, Box, Divider } from '@mui/material'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '服務條款 | Echoo',
  description: 'Echoo 服務條款',
}

export default function TermsOfService() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          服務條款
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          最後更新日期：{new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            1. 接受條款
          </Typography>
          <Typography variant="body1" paragraph>
            透過訪問或使用 Echoo 服務，您同意受本服務條款的約束。如果您不同意這些條款，請勿使用我們的服務。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            2. 服務說明
          </Typography>
          <Typography variant="body1" paragraph>
            Echoo 是一個社交媒體平台，允許使用者發布內容、與他人互動、關注其他使用者並參與各種社交活動。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            3. 使用者帳號
          </Typography>
          <Typography variant="body1" paragraph>
            要使用某些功能，您需要註冊一個帳號。您同意：
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>提供準確、最新和完整的資訊</li>
            <li>維護並及時更新您的帳號資訊</li>
            <li>對您帳號下的所有活動負責</li>
            <li>立即通知我們任何未經授權使用您帳號的情況</li>
            <li>不與他人分享您的帳號憑證</li>
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            4. 使用者行為
          </Typography>
          <Typography variant="body1" paragraph>
            您同意不會：
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>發布、上傳或分享任何非法、有害、威脅、辱罵、騷擾、誹謗、粗俗、淫穢或其他令人反感的內容</li>
            <li>侵犯他人的知識產權、隱私權或其他權利</li>
            <li>發布虛假或誤導性資訊</li>
            <li>進行任何形式的垃圾郵件、詐騙或未經授權的廣告</li>
            <li>試圖破壞、破解或規避我們服務的安全措施</li>
            <li>使用自動化工具（如機器人）來訪問或使用服務（除非我們明確允許）</li>
            <li>干擾或破壞服務的運作</li>
            <li>收集其他使用者的資訊用於未經授權的目的</li>
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            5. 內容權利
          </Typography>
          <Typography variant="body1" paragraph>
            您保留對您發布內容的所有權利。透過發布內容，您授予我們使用、複製、修改、分發和公開展示該內容的權利，僅用於提供和改進服務。
          </Typography>
          <Typography variant="body1" paragraph>
            您聲明並保證您擁有發布內容的權利，並且該內容不侵犯任何第三方的權利。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            6. 智慧財產權
          </Typography>
          <Typography variant="body1" paragraph>
            服務及其所有內容、功能和功能（包括但不限於所有資訊、軟體、文字、顯示、圖像、視訊和音頻）是 Echoo 或其授權方的專有財產，受版權、商標、專利和其他智慧財產權法律保護。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            7. 服務變更和中斷
          </Typography>
          <Typography variant="body1" paragraph>
            我們保留隨時修改、暫停或終止服務（或其任何部分）的權利，無論是否通知。我們不對任何因服務修改、暫停或終止而造成的任何損失負責。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            8. 免責聲明
          </Typography>
          <Typography variant="body1" paragraph>
            服務按「現狀」和「可用」的基礎提供。我們不對服務的準確性、完整性、可靠性或可用性做出任何明示或暗示的保證。您使用服務的風險由您自行承擔。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            9. 責任限制
          </Typography>
          <Typography variant="body1" paragraph>
            在法律允許的最大範圍內，我們不對任何間接、偶然、特殊、衍生性或懲罰性損害負責，包括但不限於利潤損失、資料損失或其他無形損失。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            10. 終止
          </Typography>
          <Typography variant="body1" paragraph>
            我們保留在任何時候，無論是否通知，因任何原因終止或暫停您的帳號和訪問服務的權利，包括但不限於違反這些服務條款。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            11. 條款變更
          </Typography>
          <Typography variant="body1" paragraph>
            我們可能會不時修改這些服務條款。我們將透過在服務上發布新的服務條款並更新「最後更新日期」來通知您任何變更。您繼續使用服務即表示您接受修改後的條款。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            12. 適用法律
          </Typography>
          <Typography variant="body1" paragraph>
            這些服務條款應根據相關法律進行解釋和管轄，不考慮其法律衝突條款。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
            13. 聯絡我們
          </Typography>
          <Typography variant="body1" paragraph>
            如果您對這些服務條款有任何問題，請透過應用程式內的聯絡方式與我們聯繫。
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

