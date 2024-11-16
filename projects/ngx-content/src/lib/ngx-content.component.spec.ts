import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { NgxContentComponent } from './ngx-content.component';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Renderer2, PLATFORM_ID, Component, ViewChild } from '@angular/core';

jest.mock('@angular/common', () => ({
  ...jest.requireActual('@angular/common'),
  isPlatformBrowser: jest.fn(),
}));

@Component({
  template: `<ngx-content [select]="select" [place]="place"></ngx-content>`,
})
class TestHostComponent {
  @ViewChild(NgxContentComponent)
  ngxContentComponent!: NgxContentComponent;

  select = '.some-selector';
  place: 'before' | 'after' | 'start' | 'end' | 'self' = 'before';
}

describe('NgxContentComponent', () => {
  let component: NgxContentComponent;
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let renderer: Renderer2;
  let mockDocument: Document;
  let mockRefElement: HTMLElement;

  beforeEach(async () => {
    mockDocument = document;

    await TestBed.configureTestingModule({
      declarations: [TestHostComponent], // Only declare TestHostComponent
      imports: [NgxContentComponent], // Import the standalone component
      providers: [
        { provide: DOCUMENT, useValue: mockDocument },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;

    fixture.detectChanges();

    component = hostComponent.ngxContentComponent;

    renderer = fixture.debugElement.injector.get(Renderer2);
    mockRefElement = document.createElement('div');
    jest.spyOn(mockDocument, 'querySelector').mockReturnValue(mockRefElement);
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restore all mocked functions
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should not perform DOM manipulations if not running in a browser', () => {
    (isPlatformBrowser as jest.Mock).mockReturnValue(false);
    const insertBeforeSpy = jest.spyOn(renderer, 'insertBefore');
    const appendChildSpy = jest.spyOn(renderer, 'appendChild');
    const removeChildSpy = jest.spyOn(renderer, 'removeChild');

    component.ngAfterViewInit();
    expect(insertBeforeSpy).not.toHaveBeenCalled();
    expect(appendChildSpy).not.toHaveBeenCalled();
    expect(removeChildSpy).not.toHaveBeenCalled();
  });

  it('should throw an error if the selector does not match any element', fakeAsync(() => {
    (isPlatformBrowser as jest.Mock).mockReturnValue(true);
    hostComponent.select = '.some-selector'; // Ensure select is set
    fixture.detectChanges();

    jest.spyOn(mockDocument, 'querySelector').mockReturnValue(null);

    expect(() => {
      component.ngAfterViewInit();
      flush(); // Flush pending timers, including requestAnimationFrame
    }).toThrowError(
      'NgxContentComponent: The provided selector did not match any elements in the document.',
    );
  }));

  it('should handle the "before" place mode correctly', fakeAsync(() => {
    (isPlatformBrowser as jest.Mock).mockReturnValue(true);
    hostComponent.place = 'before';
    fixture.detectChanges();

    const insertBeforeSpy = jest.spyOn(renderer, 'insertBefore');
    component.ngAfterViewInit();
    flush();

    expect(insertBeforeSpy).toHaveBeenCalledWith(
      mockRefElement.parentNode,
      expect.any(Node),
      mockRefElement,
      false,
    );
  }));

  it('should handle the "after" place mode correctly', fakeAsync(() => {
    (isPlatformBrowser as jest.Mock).mockReturnValue(true);
    hostComponent.place = 'after';
    fixture.detectChanges();

    const appendChildSpy = jest.spyOn(renderer, 'appendChild');
    component.ngAfterViewInit();
    flush();

    expect(appendChildSpy).toHaveBeenCalledWith(mockRefElement.parentNode, expect.any(Node));
  }));

  it('should handle the "start" place mode correctly', fakeAsync(() => {
    (isPlatformBrowser as jest.Mock).mockReturnValue(true);
    hostComponent.place = 'start';
    fixture.detectChanges();

    const insertBeforeSpy = jest.spyOn(renderer, 'insertBefore');
    component.ngAfterViewInit();
    flush();

    expect(insertBeforeSpy).toHaveBeenCalledWith(
      mockRefElement,
      expect.any(Node),
      mockRefElement.firstChild,
      false,
    );
  }));

  it('should handle the "end" place mode correctly', fakeAsync(() => {
    (isPlatformBrowser as jest.Mock).mockReturnValue(true);
    hostComponent.place = 'end';
    fixture.detectChanges();

    const appendChildSpy = jest.spyOn(renderer, 'appendChild');
    component.ngAfterViewInit();
    flush();

    expect(appendChildSpy).toHaveBeenCalledWith(mockRefElement, expect.any(Node));
  }));

  it('should handle the "self" place mode correctly', fakeAsync(() => {
    (isPlatformBrowser as jest.Mock).mockReturnValue(true);
    hostComponent.place = 'self';
    fixture.detectChanges();

    const removeChildSpy = jest.spyOn(renderer, 'removeChild');
    const appendChildSpy = jest.spyOn(renderer, 'appendChild');

    component.ngAfterViewInit();
    flush();

    expect(removeChildSpy).toHaveBeenCalledWith(mockRefElement.parentNode, mockRefElement);
    expect(appendChildSpy).toHaveBeenCalledWith(mockRefElement.parentNode, expect.any(Node));
  }));

  it('should emit the "placed" event after placing content', fakeAsync(() => {
    (isPlatformBrowser as jest.Mock).mockReturnValue(true);
    jest.spyOn(component.placed, 'emit');

    component.ngAfterViewInit();
    flush();

    expect(component.placed.emit).toHaveBeenCalled();
  }));
});
