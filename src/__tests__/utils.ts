import { getGeocode, getLatLng, LatLng, getZipCode, ZipCode } from '../utils';

describe('getGeocode', () => {
  const data = [{ place_id: '0109' }];
  const error = 'ERROR';
  const geocode = jest.fn();
  console.warn = jest.fn();
  const setupMaps = (type = 'success'): void => {
    // @ts-ignore
    global.google = {
      maps: {
        Geocoder: class {
          geocode =
            type === 'opts'
              ? geocode
              : (
                  _: object,
                  cb: (data: object[] | null, status: string) => void
                ): void => {
                  cb(
                    type === 'success' ? data : null,
                    type === 'success' ? 'OK' : error
                  );
                };
        },
      },
    };
  };

  it('should set options correctly', () => {
    setupMaps('opts');
    const opts = { address: 'Taipei', placeId: '0109' };
    getGeocode(opts);
    expect(geocode).toBeCalledWith(opts, expect.any(Function));
  });

  it('should handle success correctly', () => {
    setupMaps();
    getGeocode({ address: 'Taipei' }).then((results) => {
      expect(results).toBe(data);
    });
  });

  it('should handle failure correctly', () => {
    setupMaps('failure');
    getGeocode({ address: 'Taipei' }).catch((err) => {
      expect(err).toBe(error);
    });
  });

  it('should restrict the result to Taiwan and fail', () => {
    setupMaps('failure');
    getGeocode({
      address: 'Belgrade',
      componentRestrictions: { country: 'TW' },
    }).catch((err) => {
      expect(err).toBe(error);
    });
  });

  it('should restrict the result to Taiwan and pass', () => {
    setupMaps();
    getGeocode({
      address: 'Taipei',
      componentRestrictions: { country: 'TW' },
    }).then((results) => {
      expect(results).toBe(data);
    });
  });

  it('should warn the user for not providing the address or placeId but providing componentRestrictions and pass', () => {
    setupMaps();
    getGeocode({
      componentRestrictions: { country: 'TW', postalCode: '100' },
    }).then((results) => {
      expect(console.warn).toBeCalled();
      expect(results).toBe(data);
    });
  });
});

describe('getLatLng', () => {
  it('should handle success correctly', () => {
    const latLng = { lat: 123, lng: 456 };
    getLatLng({
      geometry: {
        // @ts-ignore
        location: {
          lat: (): number => latLng.lat,
          lng: (): number => latLng.lng,
        },
      },
    }).then((result: LatLng) => {
      expect(result).toEqual(latLng);
    });
  });

  it('should handle failure correctly', () => {
    // @ts-ignore
    getLatLng({}).catch((error) => {
      expect(error).toEqual(expect.any(Error));
    });
  });
});

describe('getZipCode', () => {
  it('should handle success correctly', () => {
    const zipCode = {
      long_name: '12345',
      short_name: '123',
      types: ['postal_code'],
    };
    // @ts-ignore
    getZipCode({ address_components: [zipCode] }).then((result: ZipCode) => {
      expect(result).toEqual(zipCode.long_name);
    });
    // @ts-ignore
    getZipCode({ address_components: [zipCode] }, true).then(
      (result: ZipCode) => {
        expect(result).toEqual(zipCode.short_name);
      }
    );
    // @ts-ignore
    getZipCode({ address_components: [] }).then((result: ZipCode) => {
      expect(result).toBeNull();
    });
  });

  it('should handle failure correctly', () => {
    // @ts-ignore
    getZipCode({}).catch((error) => {
      expect(error).toEqual(expect.any(Error));
    });
  });
});
