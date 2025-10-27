// membresia.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MembresiaService } from './membresia';

describe('MembresiaService', () => {
  let service: MembresiaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MembresiaService],
    });
    service = TestBed.inject(MembresiaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
