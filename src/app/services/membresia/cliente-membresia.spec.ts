// cliente-membresia.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ClienteMembresiaService } from './cliente-membresia';


describe('ClienteMembresiaService', () => {
  let service: ClienteMembresiaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClienteMembresiaService]
    });
    service = TestBed.inject(ClienteMembresiaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
