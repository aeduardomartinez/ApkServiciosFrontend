import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListarCuentasPage } from './listar-cuentas.page';

describe('ListarCuentasPage', () => {
  let component: ListarCuentasPage;
  let fixture: ComponentFixture<ListarCuentasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListarCuentasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
