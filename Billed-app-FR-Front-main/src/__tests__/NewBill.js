/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import Router from "../app/Router.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import store from "../__mocks__/store"
import userEvent from "@testing-library/user-event"
import BillsUI from "../views/BillsUI.js"
import Store from '../app/Store';

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

// localStorage should be populated with form data
Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: jest.fn(() =>
            JSON.stringify({
                email: 'email@test.com',
            })
        ),
    },
    writable: true,
});

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
        jest.mock("../app/Store.js").bills = () => ({ bills, get: jest.fn().mockResolvedValue() });

        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))

        Object.defineProperty(window, "location", { 
          value: { hash: ROUTES_PATH.Bills } 
        });

        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        Router()
        window.onNavigate(ROUTES_PATH.NewBill)
        await waitFor(() => screen.getByTestId('icon-mail'))
        const mailIcon = screen.getByTestId('icon-mail')

        expect(mailIcon).toBeTruthy();
        expect(mailIcon.classList.contains('active-icon')).toBeTruthy();
    });
  })


  describe('When I choose an image to upload', () => {
    test('Then the file input should get the file name', () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const inputFile = screen.getByTestId('file');
      inputFile.addEventListener('change', handleChangeFile);
      fireEvent.change(inputFile, {
          target: {
              files: [new File(['image.png'], 'image.png', {
                  type: 'image/png'
              })],
          }
      });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0].name).toBe('image.png');
      expect(screen.getByText('Envoyer une note de frais')).toBeTruthy();
      expect(html.includes("<div class=\"hideErrorMessage\" id=\"errorFileType\" data-testid=\"errorFile\">")).toBeTruthy();
    });
    test("Then it should create a new bill", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const store = null;
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
      const handleSubmit = jest.fn(newBill.handleSubmit);
      const submitBtn = screen.getByTestId("form-new-bill");
      submitBtn.addEventListener("submit", handleSubmit);
      fireEvent.submit(submitBtn);
      expect(handleSubmit).toHaveBeenCalled();
    });

    test('Then the file extension is invalid', () => {
        const html = NewBillUI();
        document.body.innerHTML = html;
        const store = null;
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
        const inputFile = screen.getByTestId("file");
        inputFile.addEventListener("change", handleChangeFile);
        fireEvent.change(inputFile, {
          target: {
            files: [new File(["image.pdf"], "image.pdf", { type: "image/pdf" })],
          },
        });
        expect(handleChangeFile).toHaveBeenCalled();
        expect(inputFile.files[0].name).toBe("image.pdf");
        expect(html.includes("<div class=\"hideErrorMessage\" id=\"errorFileType\" data-testid=\"errorFile\">")).toBeTruthy();
    });
  })
})


// test d'intégration POST
// describe("Given I am a user connected as Employee", () => {
//   describe("When I add a new bill", () => {
//       test("Then it creates a new bill", () => {
//           document.body.innerHTML = NewBillUI()
//           const inputData = {
//               type: 'Transports',
//               name: 'Test',
//               datepicker: '2021-05-26',
//               amount: '100',
//               vat: '10',
//               pct: '19',
//               commentary: 'Test',
//               file: new File(['test'], 'test.png', { type: 'image/png' }),
//           }
//           const formNewBill = screen.getByTestId('form-new-bill')
//           const inputExpenseName = screen.getByTestId('expense-name')
//           const inputExpenseType = screen.getByTestId('expense-type')
//           const inputDatepicker = screen.getByTestId('datepicker')
//           const inputAmount = screen.getByTestId('amount')
//           const inputVAT = screen.getByTestId('vat')
//           const inputPCT = screen.getByTestId('pct')
//           const inputCommentary = screen.getByTestId('commentary')
//           const inputFile = screen.getByTestId('file')

//           fireEvent.change(inputExpenseType, {
//               target: { value: inputData.type },
//           })
//           expect(inputExpenseType.value).toBe(inputData.type)

//           fireEvent.change(inputExpenseName, {
//               target: { value: inputData.name },
//           })
//           expect(inputExpenseName.value).toBe(inputData.name)

//           fireEvent.change(inputDatepicker, {
//               target: { value: inputData.datepicker },
//           })
//           expect(inputDatepicker.value).toBe(inputData.datepicker)

//           fireEvent.change(inputAmount, {
//               target: { value: inputData.amount },
//           })
//           expect(inputAmount.value).toBe(inputData.amount)

//           fireEvent.change(inputVAT, {
//               target: { value: inputData.vat },
//           })
//           expect(inputVAT.value).toBe(inputData.vat)

//           fireEvent.change(inputPCT, {
//               target: { value: inputData.pct },
//           })
//           expect(inputPCT.value).toBe(inputData.pct)

//           fireEvent.change(inputCommentary, {
//               target: { value: inputData.commentary },
//           })
//           expect(inputCommentary.value).toBe(inputData.commentary)

//           userEvent.upload(inputFile, inputData.file)
//           expect(inputFile.files[0]).toStrictEqual(inputData.file)
//           expect(inputFile.files).toHaveLength(1)
//           const newBill = new NewBill({
//               document,
//               onNavigate,
//               localStorage: window.localStorage,
//           })
//           const handleSubmit = jest.fn(newBill.handleSubmit)
//           formNewBill.addEventListener('submit', handleSubmit)
//           fireEvent.submit(formNewBill)
//           expect(handleSubmit).toHaveBeenCalled()
//       })
//       test("Then it fails with a 404 message error", async() => {
//           const html = BillsUI({ error: 'Erreur 404' })
//           document.body.innerHTML = html;
//           const message = await screen.getByText(/Erreur 404/);
//           expect(message).toBeTruthy();
//       })
//       test("Then it fails with a 500 message error", async() => {
//           const html = BillsUI({ error: 'Erreur 500' })
//           document.body.innerHTML = html;
//           const message = await screen.getByText(/Erreur 500/);
//           expect(message).toBeTruthy();
//       })
//   })
// })



// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I create a new bill", () => {
    test("Add bill to mock API POST", async () => {
        document.body.innerHTML = NewBillUI()
        const inputData = {
            type: 'Transports',
            name: 'Test',
            datepicker: '2021-05-26',
            amount: '100',
            vat: '10',
            pct: '19',
            commentary: 'Test',
            file: new File(['test'], 'test.png', { type: 'image/png' }),
        }
        const formNewBill = screen.getByTestId('form-new-bill')
        const inputExpenseName = screen.getByTestId('expense-name')
        const inputExpenseType = screen.getByTestId('expense-type')
        const inputDatepicker = screen.getByTestId('datepicker')
        const inputAmount = screen.getByTestId('amount')
        const inputVAT = screen.getByTestId('vat')
        const inputPCT = screen.getByTestId('pct')
        const inputCommentary = screen.getByTestId('commentary')
        const inputFile = screen.getByTestId('file')

        fireEvent.change(inputExpenseType, {
            target: { value: inputData.type },
        })
        expect(inputExpenseType.value).toBe(inputData.type)

        fireEvent.change(inputExpenseName, {
            target: { value: inputData.name },
        })
        expect(inputExpenseName.value).toBe(inputData.name)

        fireEvent.change(inputDatepicker, {
            target: { value: inputData.datepicker },
        })
        expect(inputDatepicker.value).toBe(inputData.datepicker)

        fireEvent.change(inputAmount, {
            target: { value: inputData.amount },
        })
        expect(inputAmount.value).toBe(inputData.amount)

        fireEvent.change(inputVAT, {
            target: { value: inputData.vat },
        })
        expect(inputVAT.value).toBe(inputData.vat)

        fireEvent.change(inputPCT, {
            target: { value: inputData.pct },
        })
        expect(inputPCT.value).toBe(inputData.pct)

        fireEvent.change(inputCommentary, {
            target: { value: inputData.commentary },
        })
        expect(inputCommentary.value).toBe(inputData.commentary)

        userEvent.upload(inputFile, inputData.file)
        expect(inputFile.files[0]).toStrictEqual(inputData.file)
        expect(inputFile.files).toHaveLength(1)
        const newBill = new NewBill({
            document,
            onNavigate,
            localStorage: window.localStorage,
        })
        const handleSubmit = jest.fn(newBill.handleSubmit)
        formNewBill.addEventListener('submit', handleSubmit)
        fireEvent.submit(formNewBill)
        expect(handleSubmit).toHaveBeenCalled()
    });

    test("Add bill to API and fails with 404 message error", async () => {
      const html = BillsUI({ error: 'Erreur 404' })
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("Add bill to API and fails with 500 message error", async () => {
      const html = BillsUI({ error: 'Erreur 500' })
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });

    test('Then create Bill and redirect to Bills', async () => {
        const html = NewBillUI();
        document.body.innerHTML = html;

        const bill = new NewBill({
            document,
            onNavigate,
            store,
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

        const submit = screen.getByTestId('form-new-bill');
        const handleSubmit = jest.fn((e) => bill.handleSubmit(e));
        submit.addEventListener('click', handleSubmit);
        userEvent.click(submit);

        expect(handleSubmit).toHaveBeenCalled();
        expect(bill).toHaveProperty("fileName")
    });
  });
});






