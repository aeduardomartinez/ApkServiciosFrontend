import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsociarPerfilesPage } from './asociar-perfiles.page';

describe('AsociarPerfilesPage', () => {
  let component: AsociarPerfilesPage;
  let fixture: ComponentFixture<AsociarPerfilesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AsociarPerfilesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
