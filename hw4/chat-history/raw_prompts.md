# 原始 Prompt 記錄 - 2024年10月21日

## Prompt 1
我後端以下這個 curl 是有打通的

```bash
curl -X POST "http://localhost:3000/api/treasures" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJhdWQiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJpYXQiOjE3Mjk0OTcxMDMsImV4cCI6MTcyOTUwMDcwMywic3ViIjoiY20yOWJ2NTFjMDAwMTEzamF6Y3Z2Z2JpYSJ9.KKRTwJOjdvOKWF5kQPQOjhN5cxMpOmxr0nH9pJO6LtI" \
  -d '{
    "title": "測試寶藏",
    "content": "這是一個測試用的寶藏",
    "type": "PHOTO",
    "latitude": 25.033964,
    "longitude": 121.564468,
    "address": "台北市信義區",
    "tags": ["測試", "照片"]
  }'
```

但是前端怎麼都打不通，一直 CORS

---

## Prompt 2
google login 的部分也都幫我使用 constants

---

## Prompt 3
我想要拿掉「我的位置」的 button，然後頁面上就直接顯示當前位置

---

## Prompt 4
現在 treasure 的 like 和 favorite 功能似乎還沒完成串接，前端送出似乎有缺欄位導致回傳 400

---

## Prompt 5
我這邊用 swagger 測試的時候會被 validator 檔下來說 id 要是 guid 但我 prisma 定義明明就是 cuid？

---

## Prompt 6
controller 和 service 在這裡怎麼分工的？怎麼感覺 controller 把事情都做完了？

---

## Prompt 7
好的請幫我處理

---

## Prompt 8
Continue: "Continue to iterate?"

---

## Prompt 9
我的這隻 like api 在測試的時候會一直跳出「Please correct the following validation errors and try again.
For 'id': Value must be a Guid.」
但我找不到原因

---

## Prompt 10
幫我把目前為止我下的 prompt 整理到 chat-history

---

## Prompt 11
我是指原封不動的 prompt 文字