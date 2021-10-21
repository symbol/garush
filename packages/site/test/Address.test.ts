import { StorageService as SomeService } from 'garush-storage';
import 'mocha';
import { Address, NetworkType } from 'symbol-sdk';

describe('Address Test', () => {
    it('created in different modules', async () => {
        //https://stackoverflow.com/questions/41587865/using-instanceof-on-objects-created-with-constructors-from-deep-npm-dependenci

        const addressString = 'TB7RMK4DTECV622CLZOCTJMMURFY7W6Z3LF6PDA';
        const address1 = Address.createFromRawAddress(addressString); // transaction created using sdk n1
        const address2 = SomeService.getAddress(addressString, NetworkType.TEST_NET); //address created using sdk n2
        console.log(address1.plain() === address2.plain()); // prints true
        console.log(address1.equals(address2)); // prints false (equals uses instanceof)
        console.log(address1 instanceof Address); // prints true
        console.log(address2 instanceof Address); // prints false
    });
});
