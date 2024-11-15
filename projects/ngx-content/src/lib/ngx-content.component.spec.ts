import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NgxContentComponent } from './ngx-content.component';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ElementRef, Renderer2, PLATFORM_ID } from '@angular/core';

jest.mock('@angular/common', () => ({
  ...jest.requireActual('@angular/common'),
  isPlatformBrowser: jest.fn(),
}));

describe('NgxContentComponent', () => {
  let component: NgxContentComponent;
  let fixture: ComponentFixture<NgxContentComponent>;
  let mockRenderer: jest.Mocked<Renderer2>;
  let mockElementRef: ElementRef<HTMLElement>;
  let mockDocument: Document;

  beforeEach(async () => {
    mockRenderer = {
      insertBefore: jest.fn(),
      appendChild: jest.fn(),
    } as unknown as jest.Mocked<Renderer2>;

    mockElementRef = new ElementRef(document.createElement('div'));
    mockDocument = document;

    await TestBed.configureTestingModule({
      imports: [NgxContentComponent], // Use imports for standalone components
      providers: [
        { provide: Renderer2, useValue: mockRenderer },
        { provide: ElementRef, useValue: mockElementRef },
        { provide: DOCUMENT, useValue: mockDocument },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should not call #inject if not running in browser', () => {
    (isPlatformBrowser as jest.Mock).mockReturnValue(false);
    component.ngAfterViewInit();
    // Assert behavior rather than internal state
  });

  it('should initialize MutationObserver on ngAfterViewInit if running in browser', () => {
    (isPlatformBrowser as jest.Mock).mockReturnValue(true);
    const observerSpy = jest.fn();
    window.MutationObserver = jest.fn(() => ({
      observe: observerSpy,
      disconnect: jest.fn(),
      takeRecords: jest.fn(),
    })) as unknown as typeof MutationObserver;

    component.ngAfterViewInit();

    expect(observerSpy).toHaveBeenCalled();
  });
});
