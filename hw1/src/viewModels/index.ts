import { PersonalInfo, Skill, Experience, Project, Milestone, SocialLink } from '@/types';
import { personalInfo, skills, experiences, projects, milestones, socialLinks } from '@/data/mockData';

// Portfolio ViewModel - 管理所有組合數據和業務邏輯
export class PortfolioViewModel {
  private _personalInfo: PersonalInfo;
  private _skills: Skill[];
  private _experiences: Experience[];
  private _projects: Project[];
  private _milestones: Milestone[];
  private _socialLinks: SocialLink[];

  constructor() {
    this._personalInfo = personalInfo;
    this._skills = skills;
    this._experiences = experiences;
    this._projects = projects;
    this._milestones = milestones;
    this._socialLinks = socialLinks;
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
}

// Navigation ViewModel - 管理導航狀態
export class NavigationViewModel {
  private _activeSection: string = 'about';
  private _isMenuOpen: boolean = false;

  get activeSection(): string {
    return this._activeSection;
  }

  get isMenuOpen(): boolean {
    return this._isMenuOpen;
  }

  setActiveSection(section: string): void {
    this._activeSection = section;
  }

  toggleMenu(): void {
    this._isMenuOpen = !this._isMenuOpen;
  }

  closeMenu(): void {
    this._isMenuOpen = false;
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
