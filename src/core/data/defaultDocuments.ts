/**
 * Default documentation and starter templates for Scripta.
 */

export const WELCOME_MD_CONTENT = `# Welcome to Scripta 🚀

A high-performance hybrid text editor and live document viewer built for the modern web. It blends lightning-fast responsiveness with offline PWA support, live split-pane previews, and an extensible background automation scripts engine.

---

### 🌟 Key Capabilities:

- ⚡ **Native File System Access**: Open, edit, and save files directly on your local storage with zero upload latency.
- 📑 **Multi-Tab Workflow**: Work across dozens of files simultaneously with real-time modified indicators and drag-and-drop tab reordering.
- 🖥️ **Full-Width Live Document Previews**:
  - **Markdown**: Extended GitHub-flavored markdown rendered across full width without narrow containers.
  - **Mermaid Diagrams**: Interactive flowcharts, sequence diagrams, state machines, and Gantt charts.
  - **Vector Graphics & Media**: Real-time SVG rendering and image previews.
  - **Web Code**: Live HTML & CSS previews.
  - **Data Inspection**: Interactive collapsible JSON tree viewer.
- 🧰 **Automated Scripting Engine**:
  - Background Web Worker architecture ensures your UI remains butter-smooth during heavy text processing.
  - Pre-packaged templates: Color Code Converter, Password-based Cipher, Delimiter/Separator Inserter, Line Filter, Case Converter, JSON Minifier/Prettifier, and more.
- 📱 **Offline-First PWA**: Fully functional offline without external network or server dependencies.
- 🔒 **Zero Telemetry & 100% Privacy**: All operations occur entirely inside your browser sandbox.

---

### 🎨 Live Mermaid Diagram Demo:

\`\`\`mermaid
graph TD
    A[User Launches Scripta] --> B{Open File or New Tab}
    B -->|Local Disk| C[Native File System Access API]
    B -->|New Tab| D[In-Memory Virtual Workspace]
    C --> E[CodeMirror 6 High-Performance Editor]
    D --> E
    E -->|Realtime AST Dispatch| F[Live Document Split Pane]
    F --> G[Full-Width Markdown & Diagrams]
    E -->|Background Thread| H[Web Worker Scripts Engine]
    H -->|Pure Client Execution| I[Transformed Output Tab]
\`\`\`

---

### ⌨️ Useful Keyboard Shortcuts:

| Action | Shortcut |
| :--- | :--- |
| **New File** | \`Alt + N\` |
| **Open File** | \`Ctrl + O\` |
| **Save File** | \`Ctrl + S\` |
| **Save As** | \`Ctrl + Shift + S\` |
| **Close Tab** | \`Alt + W\` |
| **Find & Replace** | \`Ctrl + F\` |
| **Duplicate Line** | \`Ctrl + D\` |
| **Toggle Fullscreen** | \`F11\` |

---

### 📜 Legal & Privacy Documentation:
- [Terms of Service](terms.md)
- [Privacy Policy](policy.md)

*Tip: Press **Ctrl+O** to open a file from your computer or drag & drop files anywhere onto the window!*
`;

export const TERMS_MD_CONTENT = `# Điều Khoản Sử Dụng (Terms of Service)

*Cập nhật lần cuối: Tháng 9, 2026*

Chào mừng bạn đến với **Scripta & Live Viewer** ("Dịch vụ", "Ứng dụng"). Khi truy cập hoặc sử dụng ứng dụng này, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu dưới đây.

---

### 1. Bản Quyền & Giấy Phép Mã Nguồn Mở
- Ứng dụng này là phần mềm mã nguồn mở được phát hành theo giấy phép **MIT License**.
- Bạn được toàn quyền sử dụng, sao chép, sửa đổi, hợp nhất, xuất bản, phân phối và sử dụng cho mục đích cá nhân cũng như thương mại mà không phải trả phí bản quyền.

### 2. Mô Hình Xử Lý Dữ Liệu Phía Máy Khách (Client-Side)
- **Scripta** hoạt động theo mô hình **100% Client-Side** (xử lý nội bộ trên trình duyệt máy khách).
- Toàn bộ nội dung tệp tin, văn bản, mã kịch bản (scripts) và dữ liệu bạn chỉnh sửa không bao giờ được tải lên hoặc gửi đến bất kỳ máy chủ từ xa nào.
- Bạn hoàn toàn làm chủ và chịu trách nhiệm bảo mật cho các dữ liệu văn bản được xử lý trên thiết bị của mình.

### 3. Quyền Truy Cập Hệ Thống Tệp Tin (File System Access API)
- Ứng dụng sử dụng chuẩn API của trình duyệt (\`showOpenFilePicker\`, \`showSaveFilePicker\`) để đọc và ghi tệp tin trên ổ đĩa của bạn.
- Việc đọc và ghi chỉ diễn ra khi bạn chủ động cấp quyền thông qua hộp thoại của hệ điều hành. Ứng dụng không tự ý quét hoặc truy cập các thư mục ngoài phạm vi bạn đã chỉ định.

### 4. Sử Dụng Trình Thực Thi Kịch Bản (Scripts Engine)
- Tính năng Scripts Manager cho phép bạn chạy mã JavaScript tùy chỉnh trong môi trường Web Worker cô lập trên trình duyệt của bạn.
- Bạn chịu trách nhiệm hoàn toàn đối với nội dung và hành vi của các tập lệnh (scripts) do bạn tự viết hoặc import từ các nguồn bên ngoài.
- Dịch vụ không chịu trách nhiệm đối với bất kỳ sự thay đổi hay mất mát dữ liệu nào do việc thực thi các tập lệnh không rõ nguồn gốc.

### 5. Miễn Trừ Trách Nhiệm (Disclaimer of Warranty)
- DỊCH VỤ ĐƯỢC CUNG CẤP TRÊN NGUYÊN TẮC **"NGUYÊN TRẠNG" (AS IS)** VÀ **"SẴN CÓ" (AS AVAILABLE)**, KHÔNG CÓ BẤT KỲ SỰ ĐẢM BẢO NÀO, DÙ RÕ RÀNG HAY NGỤ Ý.
- Chúng tôi không bảo đảm rằng ứng dụng sẽ hoạt động không có lỗi hoặc không bị gián đoạn. Trong mọi trường hợp, các nhà phát triển sẽ không chịu trách nhiệm đối với bất kỳ thiệt hại trực tiếp, gián tiếp, ngẫu nhiên hoặc do hậu quả phát sinh từ việc sử dụng ứng dụng.

### 6. Sửa Đổi Điều Khoản
- Chúng tôi có thể cập nhật các Điều khoản này khi ứng dụng có các tính năng mới. Phiên bản cập nhật sẽ được thể hiện trực tiếp trong ứng dụng.
`;

export const POLICY_MD_CONTENT = `# Chính Sách Bảo Mật (Privacy Policy)

*Cập nhật lần cuối: Tháng 9, 2026*

Quyền riêng tư của bạn là ưu tiên hàng đầu và cốt lõi trong thiết kế của **Scripta & Live Viewer**. Chính sách bảo mật này giải thích cách ứng dụng hoạt động liên quan đến dữ liệu người dùng.

---

### 1. Không Thu Thập Dữ Liệu Cá Nhân
- Chúng tôi **KHÔNG** thu thập, ghi nhận, hay chia sẻ bất kỳ thông tin nhận dạng cá nhân nào của bạn (như tên, email, địa chỉ IP, vị trí địa lý).
- Bạn không cần phải tạo tài khoản, đăng nhập hoặc cung cấp bất kỳ thông tin cá nhân nào để sử dụng đầy đủ mọi tính năng của ứng dụng.

### 2. Không Thu Thập Nội Dung Tệp Tin
- Mọi tệp tin bạn mở, xem, chỉnh sửa hoặc lưu lại đều được xử lý cục bộ thông qua các hàm API trong trình duyệt của bạn.
- Nội dung tệp **KHÔNG BAO GIỜ** được truyền qua mạng Internet hay lưu trữ trên bất kỳ máy chủ bên ngoài nào.

### 3. Không Sử Dụng Mã Theo Dõi (Zero Tracking / Zero Telemetry)
- Ứng dụng **KHÔNG** tích hợp các công cụ phân tích của bên thứ ba như Google Analytics, Facebook Pixel, hay các dịch vụ theo dõi hành vi tương tự.
- Ứng dụng không tạo hoặc lưu trữ bất kỳ cookie quảng cáo nào.

### 4. Lưu Trữ Cục Bộ (IndexedDB & LocalStorage)
- Ứng dụng sử dụng cơ sở dữ liệu nội bộ **IndexedDB** của trình duyệt nhằm mục đích duy nhất:
  - Tự động lưu phiên làm việc (các tab đang mở) để phục hồi khi bạn vô tình đóng trình duyệt.
  - Lưu trữ các kịch bản tự động (Scripts & Functions) do bạn tạo hoặc chọn cài đặt.
  - Lưu tùy chọn cá nhân hóa (giao diện Sáng/Tối, cỡ chữ, phím tắt).
- Tất cả các dữ liệu này được bảo vệ trong sandbox riêng của trình duyệt và chỉ có bạn trên thiết bị đó mới có quyền truy cập.

### 5. Hoạt Động Ngoại Tuyến (Offline Capable)
- Nhờ công nghệ Progressive Web App (PWA) và Service Worker, toàn bộ mã nguồn ứng dụng được lưu vào bộ nhớ cache của trình duyệt sau lần tải đầu tiên.
- Ứng dụng hoạt động độc lập và đầy đủ chức năng ngay cả khi bạn ngắt hoàn toàn kết nối Internet (Airplane mode).

### 6. Quyền Quản Lý Dữ Liệu Của Bạn
- Bạn có toàn quyền xóa mọi dữ liệu đã lưu bất kỳ lúc nào bằng cách:
  - Đóng các tab trong ứng dụng.
  - Sử dụng nút **Export JSON** / **Import JSON** trong Script Manager để sao lưu hoặc di chuyển dữ liệu.
  - Xóa dữ liệu duyệt web (Clear Site Data / Storage) trong cài đặt của trình duyệt.

### 7. Liên Hệ & Đóng Góp
- Nếu bạn có câu hỏi hoặc đề xuất về quyền riêng tư và bảo mật, vui lòng tạo issue hoặc thảo luận trực tiếp trên kho lưu trữ mã nguồn của dự án.
`;
