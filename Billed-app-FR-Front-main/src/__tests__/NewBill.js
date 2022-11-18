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

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
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
})

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page and I add an image file", () => {
    test("Then this new file should have been changed in the input file", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const store = null;
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["image.png"], "image.png", { type: "image/png" })],
        },
      });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0].name).toBe("image.png");
    });
  });
});

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page and I submit the form width an image (jpg, jpeg, png)", () => {
    test("Then it should create a new bill", () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

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
  });
});

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page and I add a file other than an image (jpg, jpeg or png)", () => {
    test("Then, the bill shouldn't be created and I stay on the NewBill page", () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

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
      newBill.fileName = "invalid";
      const submitBtn = screen.getByTestId("form-new-bill");
      submitBtn.addEventListener("submit", handleSubmit);

      fireEvent.submit(submitBtn);
      expect(handleSubmit).toHaveBeenCalled();
      expect(html.includes("<div class=\"hideErrorMessage\" id=\"errorFileType\" data-testid=\"errorFile\">")).toBeTruthy();
    });
  });
});

// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I create a new bill", () => {
    test("Add bill to mock API POST", async () => {
      const getSpy = jest.spyOn(mockStore, "bills");

      const bill = {
        id: "eoKIpYhECmaZAGRrHjaC",
        status: "refused",
        pct: 10,
        amount: 500,
        email: "john@doe.com",
        name: "Facture 236",
        vat: "60",
        fileName: "preview-facture-free-201903-pdf-1.jpg",
        date: "2021-03-13",
        commentAdmin: "à valider",
        commentary: "A déduire",
        type: "Restaurants et bars",
        fileUrl: "https://saving.com",
      }
      const bills = await mockStore.bills().create(bill);
      expect(getSpy).toHaveBeenCalledTimes(1);
    });

    test("Add bill to API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("Add bill to API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});

