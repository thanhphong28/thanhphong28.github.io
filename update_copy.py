import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

replacements = [
    (
        r'Xây dựng <strong>trải nghiệm web không gian 3D</strong> hiện đại, mượt mà và tập trung vào hiệu năng tại TP\.\s*Hồ Chí Minh\.',
        r'Kiến tạo các <strong>ứng dụng Web hiệu năng cao</strong>, giải quyết bài toán nghiệp vụ phức tạp bằng kiến trúc Frontend chuẩn mực và trải nghiệm UI/UX không độ trễ.'
    ),
    (
        r'Phát triển và tối ưu hóa hệ thống giao diện khám chữa bệnh trực tuyến, thiết kế UI/UX theo tiêu chuẩn y\s*tế và tích hợp hệ thống API quản lý bệnh án\.',
        r'Trực tiếp phát triển hệ thống EMR (Bệnh án điện tử), tối ưu hóa luồng dữ liệu API thời gian thực và cải thiện 40% tốc độ render UI. Xây dựng các component phức tạp phục vụ hàng ngàn lượt tương tác mỗi ngày.'
    ),
    (
        r'Trưởng nhóm dẫn dắt 5 thành viên, quản lý tiến độ sprint, phát triển giao diện web ReactJS, tích hợp\s*REST API và chịu trách nhiệm review code cho toàn bộ dự án\.',
        r'Dẫn dắt đội ngũ 5 kỹ sư triển khai dự án đúng tiến độ (Agile/Scrum). Định hình chuẩn Coding Convention, thiết lập quy trình Code Review khắt khe nhằm giảm thiểu technical debt trên môi trường Production.'
    ),
    (
        r'Hỗ trợ vận hành nền tảng học tập trực tuyến, xử lý sự cố người dùng, quản trị tài khoản và trực tiếp\s*hướng dẫn giáo viên/học sinh tại các trường học\.',
        r'Hỗ trợ vận hành hệ thống EdTech quy mô lớn. Trực tiếp xử lý các bottleneck từ phía người dùng cuối, phân tích log sự cố để phối hợp cùng team Dev tối ưu hóa tính ổn định của hệ thống.'
    ),
    (
        r'Hệ thống SaaS quản lý phòng tập Boxing chuyên nghiệp\. Tích hợp Command Center, phân quyền đa cấp, quản lý gói tập, thanh toán và điểm danh Mobile-first siêu tốc\.',
        r'Kiến trúc SaaS quản lý phòng tập toàn diện. Giải quyết triệt để bài toán vận hành bằng Command Center, luồng thanh toán chặt chẽ và điểm danh QR Mobile-first, giúp doanh nghiệp cắt giảm 80% thời gian quản lý thủ công.'
    ),
    (
        r'Ứng dụng lập kế hoạch thời gian thực dành cho các cặp đôi\. Giao diện đẹp mắt, Responsive tối đa và đồng bộ hóa lập tức các hoạt động hàng tuần\.',
        r'Web App quản lý lịch trình theo thời gian thực (Real-time Sync). Xử lý mượt mà trạng thái Client-Server, tối ưu hóa bundle size với Vite và kiến tạo trải nghiệm người dùng như một ứng dụng Native thực thụ.'
    ),
    (
        r'Hệ thống đặt vé xem phim trực tuyến toàn diện\. Chọn ghế realtime, thanh toán QR, quản lý ca chiếu và phân\s*quyền admin đa cụm rạp\.',
        r'Hệ thống quản lý cụm rạp phức tạp với cơ chế khóa ghế Concurrent (chống trùng vé). Thiết kế Database chuẩn hóa và API phân quyền bảo mật cao cho hàng loạt vai trò quản trị.'
    ),
    (
        r'Trải nghiệm mua sắm thiết bị Apple tối giản, luồng giỏ hàng liền mạch và bảng quản trị sản phẩm hiện đại\.',
        r'E-commerce Platform tập trung vào tỷ lệ chuyển đổi (Conversion Rate). Tối ưu hóa luồng Checkout không độ trễ, quản lý State giỏ hàng phức tạp và bảng điều khiển Inventory trực quan.'
    ),
    (
        r'Hệ thống quản lý bệnh án số phân quyền 3 cấp \(Bệnh nhân, Bác sĩ, Quản trị viên\) đảm bảo bảo mật và dễ dàng\s*truy xuất bệnh sử\.',
        r'Kiến trúc phần mềm y tế (HIS) đáp ứng chuẩn bảo mật dữ liệu. Xử lý logic phân quyền RBAC 3 cấp độ, đảm bảo khả năng truy xuất hồ sơ bệnh án khối lượng lớn với độ trễ thấp.'
    ),
    (
        r'Trang bán hàng thời trang thể thao phong cách Nike hiện đại\. Tối ưu hiệu ứng cuộn, animation mượt mà và\s*đặt hàng nhanh\.',
        r'Thực nghiệm kỹ thuật Micro-interactions & Scroll-driven Animations nhằm tạo ra trải nghiệm mua sắm Immersive. Codebase thuần (Vanilla) minh chứng khả năng kiểm soát DOM ở mức độ sâu.'
    ),
    (
        r'Tôi là <strong>Nguyễn Thanh Phong</strong>, tốt nghiệp chuyên ngành Kỹ thuật Phần mềm tại Đại học Sài Gòn\.\s*Tôi đam mê kiến tạo giao diện web trực quan, giàu tính nghệ thuật nhưng luôn đảm bảo tốc độ phản hồi tối\s*ưu và khả năng mở rộng lâu dài\.',
        r'Là một Frontend Software Engineer xuất thân từ Kỹ thuật Phần mềm (SGU), tôi không chỉ "vẽ" giao diện. Tôi kiến trúc các hệ thống Web phía Client với sự khắt khe về <strong>Clean Code, State Management và Web Performance</strong>. Mục tiêu của tôi là biến các bài toán Business phức tạp thành những trải nghiệm người dùng mượt mà, không độ trễ.'
    ),
    (
        r'"Nơi nghệ thuật thị giác hòa cùng sức mạnh công nghệ\."',
        r'"Product-Minded Engineer: Code tạo ra giá trị doanh nghiệp."'
    ),
    (
        r'Đề cao tính chính trực, tinh thần học hỏi liên tục và trách nhiệm tuyệt đối trong từng dòng mã nguồn được\s*bàn giao\.',
        r'Tư duy phát triển sản phẩm thực tế: Viết code không chỉ để chạy đúng yêu cầu, mà phải dễ bảo trì, dễ mở rộng quy mô và trực tiếp đóng góp vào thành công của Product.'
    )
]

for pattern, repl in replacements:
    html, count = re.subn(pattern, repl, html)
    if count == 0:
        print(f"Failed to match: {pattern}")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Copywriting updated!")