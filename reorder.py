import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Update Navbars
nav_pattern = r'(<nav class="nav-center"[^>]*>)(.*?)(</nav>)'
def nav_repl(m):
    return m.group(1) + '''
      <a href="#experience">Kinh Nghiệm</a>
      <a href="#personal-projects">Dự Án Cá Nhân</a>
      <a href="#projects">Đồ Án</a>
      <a href="#about">Giới Thiệu</a>
      <a href="#contact">Liên Hệ</a>
    ''' + m.group(3)
html = re.sub(nav_pattern, nav_repl, html, flags=re.DOTALL)

mobile_nav_pattern = r'(<div class="mobile-nav" id="mobileNav">)(.*?)(<a href="CV_Nguyen)'
def mobile_nav_repl(m):
    return m.group(1) + '''
    <a href="#experience">Kinh Nghiệm</a>
    <a href="#personal-projects">Dự Án Cá Nhân</a>
    <a href="#projects">Đồ Án</a>
    <a href="#about">Giới Thiệu</a>
    <a href="#contact">Liên Hệ</a>
    ''' + m.group(3)
html = re.sub(mobile_nav_pattern, mobile_nav_repl, html, flags=re.DOTALL)

# Extract sections
# Hero: <section class="hero" id="home"> ... </section> (ends before <!-- ==================== PROJECTS)
hero_match = re.search(r'(<!-- ==================== HERO ==================== -->.*?)(?=<!-- ==================== PROJECTS)', html, re.DOTALL)
projects_match = re.search(r'(<!-- ==================== PROJECTS ==================== -->.*?)(?=<!-- ==================== ABOUT)', html, re.DOTALL)
about_match = re.search(r'(<!-- ==================== ABOUT ==================== -->.*?)(?=<!-- ==================== EXPERIENCE)', html, re.DOTALL)
exp_match = re.search(r'(<!-- ==================== EXPERIENCE ==================== -->.*?)(?=<!-- ==================== CONTACT)', html, re.DOTALL)

if not (hero_match and projects_match and about_match and exp_match):
    print("Could not find sections!")
    exit(1)

hero_sec = hero_match.group(1)
projects_sec = projects_match.group(1)
about_sec = about_match.group(1)
exp_sec = exp_match.group(1)

# Rename "Dự Án Nổi Bật" to "Đồ Án Nổi Bật"
projects_sec = projects_sec.replace('Dự Án Nổi Bật', 'Đồ Án Nổi Bật')

# Create Personal Projects section
personal_projects_sec = '''
    <!-- ==================== PERSONAL PROJECTS ==================== -->
    <section class="section-wrapper" id="personal-projects">
      <div class="container">
        <div class="section-header reveal">
          <p class="section-label">REAL-WORLD APPLICATIONS</p>
          <h2 class="section-title">Dự Án Cá Nhân Nổi Bật</h2>
          <p class="section-desc">Các sản phẩm SaaS và ứng dụng thực tế được phát triển độc lập với kiến trúc hiện đại, tập trung vào giải quyết vấn đề của người dùng.</p>
        </div>

        <div class="projects-bento">
          <!-- Personal Project 1 -->
          <article class="spotlight-card project-card reveal">
            <div class="project-top-row">
              <span class="project-tag-pill">SaaS PLATFORM</span>
              <span class="project-year">2026</span>
            </div>
            <h3 class="project-title">TFC-Boxing Studio Management</h3>
            <p class="project-desc">
              Hệ thống quản lý phòng tập Boxing & Muay Thai chuyên nghiệp. Giải pháp phần mềm vận hành doanh nghiệp thực tế giúp chủ studio tiết kiệm thời gian quản lý để tập trung vào huấn luyện.
            </p>
            <div class="project-browser-frame">
              <div class="browser-header">
                <span class="browser-dot"></span>
                <span class="browser-dot"></span>
                <span class="browser-dot"></span>
                <span class="browser-url-bar">tfc-boxing.studio</span>
              </div>
              <img src="images/tfc-boxing.webp" alt="TFC Boxing Studio" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;" onerror="this.src='images/pro1.webp'" />
            </div>
            <div class="project-footer">
              <div class="project-tech-pills">
                <span>React 18</span>
                <span>TypeScript</span>
                <span>Supabase</span>
                <span>Tailwind CSS</span>
              </div>
              <a class="project-action-link" href="#" target="_blank" rel="noopener" style="pointer-events: none; opacity: 0.5;">
                Private Source <i class="fas fa-lock"></i>
              </a>
            </div>
          </article>

          <!-- Personal Project 2 -->
          <article class="spotlight-card project-card reveal reveal-delay-1">
            <div class="project-top-row">
              <span class="project-tag-pill">WEB APPLICATION</span>
              <span class="project-year">2026</span>
            </div>
            <h3 class="project-title">Couple Schedule & Master Plan</h3>
            <p class="project-desc">
              Ứng dụng lập kế hoạch thời gian thực dành cho các cặp đôi. Giao diện đẹp mắt, Responsive tối đa và đồng bộ hóa lập tức các hoạt động hàng tuần.
            </p>
            <div class="project-browser-frame">
              <div class="browser-header">
                <span class="browser-dot"></span>
                <span class="browser-dot"></span>
                <span class="browser-dot"></span>
                <span class="browser-url-bar">schedule-couple.vercel.app</span>
              </div>
              <img src="images/couple-schedule.webp" alt="Couple Schedule" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;" onerror="this.src='images/pro2.webp'" />
            </div>
            <div class="project-footer">
              <div class="project-tech-pills">
                <span>React 19</span>
                <span>Vite</span>
                <span>Supabase</span>
                <span>Tailwind CSS</span>
              </div>
              <a class="project-action-link" href="https://schedule-couple.vercel.app/" target="_blank" rel="noopener">
                Live Demo <i class="fas fa-external-link-alt"></i>
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
'''

# New order: Hero -> Exp -> Personal Projects -> Projects -> About
new_html = html[:hero_match.start()] + hero_sec + exp_sec + personal_projects_sec + projects_sec + about_sec + html[exp_match.end():]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Successfully reordered and updated sections!")