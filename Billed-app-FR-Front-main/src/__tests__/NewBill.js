/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import Router from "../app/Router.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import userEvent from "@testing-library/user-event"
import BillsUI from "../views/BillsUI.js"
import Store from '../app/Store';

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

// LocalStorage - Employee
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }) );


// Init newBill
const newBill = {
    id: 'QcCK3SzECmaZAGRrHjaC',
    status: 'refused',
    pct: 20,
    amount: 200,
    email: 'a@a',
    name: 'newBill',
    vat: '40',
    fileName: 'preview-facture-free-201801-pdf-1.jpg',
    date: '2002-02-02',
    commentAdmin: 'pas la bonne facture',
    commentary: 'test2',
    type: 'Restaurants et bars',
    fileUrl: 'https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=4df6ed2c-12c8-42a2-b013-346c1346f732'
};

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test('Then letter icon in vertical layout should be highlighted', async() => {

        // Mock - parameters for bdd Firebase & data fetching
        jest.mock("../app/Store.js").bills = () => ({ 
          bills, 
          get: jest.fn().mockResolvedValue() 
        });

        // Build div DOM
        Object.defineProperty(window, "location", { 
          value: { hash: ROUTES_PATH.Bills } 
        });

        document.body.innerHTML = `<div id='root'></div>`;

        // Router init to get actives CSS classes
        Router()
        window.onNavigate(ROUTES_PATH.NewBill)

        // Screen must contain 'icon-mail'
        await waitFor(() => screen.getByTestId('icon-mail'))
        const mailIcon = screen.getByTestId('icon-mail')
        expect(mailIcon).toBeTruthy();

        // "icon-mail" must contain the class "active-icon"
        expect(mailIcon.classList.contains('active-icon')).toBeTruthy();
    });  
  });


  describe('When I choose an image to upload', () => {
    test('Then the file input should get the file name', () => {
      
        // Build user interface
        const html = NewBillUI();
        document.body.innerHTML = html;

        // Init newBill
        const newBill = new NewBill({
            document,
            onNavigate,
            store: null,
            localStorage: window.localStorage,
        });

        // Mock function handleChangeFile
        const handleChangeFile = jest.fn(() => newBill.handleChangeFile);

        // Add Event and fire
        const inputFile = screen.getByTestId('file');
        inputFile.addEventListener('change', handleChangeFile);

        // Launch event
        fireEvent.change(inputFile, {
            target: {
                files: [new File(['image.png'], 'image.png', {
                    type: 'image/png'
                })],
            }
        });

        // handleChangeFile function must be called
        expect(handleChangeFile).toBeCalled();

        // The name of the file should be 'image.png'
        expect(inputFile.files[0].name).toBe('image.png');
        expect(screen.getByText('Envoyer une note de frais')).toBeTruthy();

        // HTML must contain 'hideErrorMessage'
        expect(html.includes("<div class=\"hideErrorMessage\" id=\"errorFileType\" data-testid=\"errorFile\">")).toBeTruthy();
    });
  
    test('Then the file extension is invalid', () => {
      
        // Build user interface
        const html = NewBillUI();
        document.body.innerHTML = html;

        // Init newBill
        const newBill = new NewBill({
            document,
            onNavigate,
            store: null,
            localStorage: window.localStorage,
        });

        // Mock function handleChangeFile
        const handleChangeFile = jest.fn(() => newBill.handleChangeFile);

        // Add Event and fire
        const inputFile = screen.getByTestId('file');
        inputFile.addEventListener('change', handleChangeFile);

        // Launch event
        fireEvent.change(inputFile, {
            target: {
                files: [new File(['image.pdf'], 'image.pdf', {
                    type: 'image/pdf'
                })],
            }
        });

        // handleChangeFile function must be called
        expect(handleChangeFile).toBeCalled();

        // The name of the file should be 'image.png'
        expect(inputFile.files[0].name).toBe('image.pdf');

        // HTML must contain 'hideErrorMessage'
        expect(html.includes("<div class=\"hideErrorMessage\" id=\"errorFileType\" data-testid=\"errorFile\">")).toBeTruthy();
    });
  });


  describe("When I submit the form width an image (jpg, jpeg, png)", () => {
    test("Then it should create a new bill", () => {

      // Build user interface
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Init newBill
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      // Mock function handleSubmit
      const handleSubmit = jest.fn(newBill.handleSubmit);

      // EventListener to submit the form
      const submitBtn = screen.getByTestId("form-new-bill");
      submitBtn.addEventListener("submit", handleSubmit);
      fireEvent.submit(submitBtn);

      // HandleSubmit function must be called
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe("When I create a new bill", () => {
    test("Add bill to mock API POST", async () => {

      // Arrange
      const getSpy = jest.spyOn(mockStore, "bills");
  
      const file = new File(['content'], "preview-facture-free-201903-pdf-1.jpg");
      const email = "john@doe.com";
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', email);
      const bill = {
        data: formData,
        headers: {
          noContentType: true
        }
      };

      // Act
      const result = await mockStore.bills().create(bill);
  
      // Assert
      // getSpy must have been called once
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty("fileUrl");
      expect(result).toHaveProperty("key");
    });


    test("Add bill to API and fails with 404 message error", async () => {
      
      mockStore.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;

      // wait for the 404 error message
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    
    test("Add bill to API and fails with 500 message error", async () => {

      mockStore.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;

      // wait for the 500 error message
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });

    test('Then create Bill and redirect to Bills', async () => {

      // Build user interface
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Init newBill
      const bill = new NewBill({
          document,
          onNavigate,
          Store,
          localStorage: window.localStorage,
      });

      bill.create = (bill) => bill;        

      // Filling DOM elements
      document.querySelector(`select[data-testid='expense-type']`).value = newBill.type;
      document.querySelector(`input[data-testid='expense-name']`).value = newBill.name;
      document.querySelector(`input[data-testid='amount']`).value = newBill.amount;
      document.querySelector(`input[data-testid='datepicker']`).value = newBill.date;
      document.querySelector(`input[data-testid='vat']`).value = newBill.vat;
      document.querySelector(`input[data-testid='pct']`).value = newBill.pct;
      document.querySelector(`textarea[data-testid='commentary']`).value = newBill.commentary;
      bill.fileUrl = newBill.fileUrl;
      bill.fileName = newBill.fileName;

      // Get form
      const submit = screen.getByTestId('form-new-bill');

      // EventListener to submit the form
      const handleSubmit = jest.fn((e) => bill.handleSubmit(e));
      submit.addEventListener('click', handleSubmit);
      userEvent.click(submit);

      // HandleSubmit function must be called
      expect(handleSubmit).toHaveBeenCalled();

      // We must meet on '# employee / bills'
      expect(document.body.innerHTML).toBe('#employee/bills');
    });

  });

})
