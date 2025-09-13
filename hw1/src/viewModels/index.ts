import { PersonalInfo, Skill, Experience, Project, Milestone, SocialLink, TravelDestination } from '@/types';
import { personalInfo, skills, experiences, projects, milestones, socialLinks, travelDestinations } from '@/data/mockData';

// Portfolio ViewModel - 管理所有組合數據和業務邏輯
export class PortfolioViewModel {
  private static instance: PortfolioViewModel;
  private _personalInfo: PersonalInfo;
  private _skills: Skill[];
  private _experiences: Experience[];
  private _projects: Project[];
  private _milestones: Milestone[];
  private _socialLinks: SocialLink[];
  private _travelDestinations: TravelDestination[];
  private _loadedDescription: string | null = null;

  private constructor() {
    this._personalInfo = personalInfo;
    this._skills = skills;
    this._experiences = experiences;
    this._projects = projects;
    this._milestones = milestones;
    this._socialLinks = socialLinks;
    this._travelDestinations = travelDestinations;
  }

  public static getInstance(): PortfolioViewModel {
    if (!PortfolioViewModel.instance) {
      PortfolioViewModel.instance = new PortfolioViewModel();
    }
    return PortfolioViewModel.instance;
  }

  // 載入 description 檔案內容
  async loadDescription(): Promise<string> {
    if (this._loadedDescription) {
      return this._loadedDescription;
    }

    // 如果 description 是檔案名稱，就透過 API 讀取檔案內容
    if (this._personalInfo.description.endsWith('.txt')) {
      try {
        const response = await fetch(`/api/content?file=${this._personalInfo.description}`);
        const data = await response.json();
        if (data.content) {
          this._loadedDescription = data.content;
          return data.content;
        }
      } catch (error) {
        console.error('Error loading description:', error);
      }
    }
    
    // 如果讀取失敗或不是檔案名稱，返回原始值
    return this._personalInfo.description;
  }

  // Getters for data access
  get personalInfo(): PersonalInfo {
    return this._personalInfo;
  }

  get skills(): Skill[] {
    return this._skills;
  }

  get experiences(): Experience[] {
    return this._experiences;
  }

  get projects(): Project[] {
    return this._projects;
  }

  get featuredProjects(): Project[] {
    return this._projects.filter(project => project.featured);
  }

  get milestones(): Milestone[] {
    return this._milestones;
  }

  get socialLinks(): SocialLink[] {
    return this._socialLinks;
  }

  get travelDestinations(): TravelDestination[] {
    return this._travelDestinations;
  }

  // Business logic methods
  getSkillsByCategory(category: Skill['category']): Skill[] {
    return this._skills.filter(skill => skill.category === category);
  }

  getExperiencesByType(type: Experience['type']): Experience[] {
    return this._experiences.filter(exp => exp.type === type);
  }

  getMilestonesByType(type: Milestone['type']): Milestone[] {
    return this._milestones.filter(milestone => milestone.type === type);
  }

  getProjectById(id: string): Project | undefined {
    return this._projects.find(project => project.id === id);
  }

  searchProjects(query: string): Project[] {
    const lowercaseQuery = query.toLowerCase();
    return this._projects.filter(project =>
      project.title.toLowerCase().includes(lowercaseQuery) ||
      project.description.toLowerCase().includes(lowercaseQuery) ||
      project.technologies.some(tech => tech.toLowerCase().includes(lowercaseQuery))
    );
  }

  getTravelDestinationById(id: string): TravelDestination | undefined {
    return this._travelDestinations.find(destination => destination.id === id);
  }
}

// Navigation ViewModel - 管理導航狀態
export class NavigationViewModel {
  private _activeSection: string = 'about';
  private _isMenuOpen: boolean = false;
  private _listeners: Set<() => void> = new Set();

  get activeSection(): string {
    return this._activeSection;
  }

  get isMenuOpen(): boolean {
    return this._isMenuOpen;
  }

  // 添加狀態變更監聽器
  addListener(listener: () => void): void {
    this._listeners.add(listener);
  }

  // 移除狀態變更監聽器
  removeListener(listener: () => void): void {
    this._listeners.delete(listener);
  }

  // 通知所有監聽器狀態已變更
  private notifyListeners(): void {
    this._listeners.forEach(listener => listener());
  }

  setActiveSection(section: string): void {
    if (this._activeSection !== section) {
      this._activeSection = section;
      this.notifyListeners();
    }
  }

  toggleMenu(): void {
    this._isMenuOpen = !this._isMenuOpen;
    this.notifyListeners();
  }

  closeMenu(): void {
    if (this._isMenuOpen) {
      this._isMenuOpen = false;
      this.notifyListeners();
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      this.setActiveSection(sectionId);
      this.closeMenu();
    }
  }
}

// Scroll ViewModel - 管理滾動效果
export class ScrollViewModel {
  private _scrollY: number = 0;
  private _isScrolled: boolean = false;

  get scrollY(): number {
    return this._scrollY;
  }

  get isScrolled(): boolean {
    return this._isScrolled;
  }

  updateScroll(scrollY: number): void {
    this._scrollY = scrollY;
    this._isScrolled = scrollY > 50;
  }

  getScrollProgress(): number {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    return totalHeight > 0 ? (this._scrollY / totalHeight) * 100 : 0;
  }
}
