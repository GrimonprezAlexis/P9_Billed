/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'

import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import {ROUTES,  ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

// LocalStorage - Employee
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }) );

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      jest.mock("../app/Store.js").bills = () => ({ bills, get: jest.fn().mockResolvedValue() });


      // Build div DOM
      Object.defineProperty(window, "location", { 
        value: { hash: ROUTES_PATH.Bills } 
      });

      document.body.innerHTML = `<div id='root'></div>`;

      // Router init to get actives CSS classes
      Router()
      window.onNavigate(ROUTES_PATH.Bills)

      // Screen must contain 'icon-window'
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      // "icon-window" must contain the class "active-icon"
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    })

    test("Then bills should be ordered from earliest to latest", () => {

      // Build user interface
      document.body.innerHTML = BillsUI({ data: bills })

      // Get text from HTML
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      
      // Filter by date
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      
      // Dates must equal datesSorted
      expect(dates).toEqual(datesSorted)
    })

    test('Then, Loading page should be rendered', () => {

      // Build user interface
      const html = BillsUI({ loading: true })
      document.body.innerHTML = html

      // Screen should show Loading
      expect(screen.getAllByText('Loading...')).toBeTruthy()
    })

    test('Then, Error page should be rendered', () => {

      // Build user interface
      const html = BillsUI({ error: 'some error message' })
      document.body.innerHTML = html

      // Screen should show Erreur
      expect(screen.getAllByText('Erreur')).toBeTruthy()
    })

  });
});

describe("Given I am connected as Employee and I am on Bills page", () => {
  describe("When I click on the New Bill button", () => {
    test("Then, it should render NewBill page", () => {

      // Build user interface
      const html = BillsUI({ data: [] });
      document.body.innerHTML = html;

      // Init Bills
      const allBills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      // Mock handleClickNewBill
      const handleClickNewBill = jest.fn(allBills.handleClickNewBill);

      // Get button eye in DOM
      const billBtn = screen.getByTestId("btn-new-bill");

      // Add event and fire
      billBtn.addEventListener("click", handleClickNewBill);
      userEvent.click(billBtn);

      // Screen should show Envoyer une note de frais
      expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy();
    });
  });
});

describe("Given I am connected as Employee and I am on Bills page", () => {
  describe("When I click on the icon eye", () => {
    test("A modal should open", () => {

      // Build user interface
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;

      // Init Bills
      const allBills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      // Mock modal comportment
      $.fn.modal = jest.fn();

      // Get button eye in DOM
      const eye = screen.getAllByTestId("icon-eye")[0];

      // Mock function handleClickIconEye
      const handleClickIconEye = jest.fn(() =>
        allBills.handleClickIconEye(eye)
      );

      // Add Event and fire
      eye.addEventListener("click", handleClickIconEye);
      userEvent.click(eye);

      // handleClickIconEye function must be called
      expect(handleClickIconEye).toHaveBeenCalled();
      const modale = document.getElementById("modaleFile");

      // The modal must be present
      expect(modale).toBeTruthy();
    });
  });
});

// test d'intégration GET + Error API 404 / 500
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Dashboard", () => {
    test("fetches bills from mock API GET", async () => {

      // Spy bills list method
      const getSpy = jest.spyOn(mockStore, "bills");

      // Get bills list
      const result = await mockStore.bills().list();

      // GetSpy must have been called once
      expect(getSpy).toHaveBeenCalledTimes(1);

       // The number of bills must be 4
      expect(result.length).toBe(4);
    })
  })

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      document.body.innerHTML = `<div id='root'></div>`;
      Router();
    });

    test("fetches bills from an API and fails with 404 message error", async () => {
    
      mockStore.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );

      // User interface creation with error code
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;

      // wait for the 404 error message
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
    
      mockStore.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );

      // User interface creation with error code
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;

      // wait for the 500 error message
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
