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

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
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
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test('Then, Loading page should be rendered', () => {
      const html = BillsUI({ loading: true })
      document.body.innerHTML = html
      expect(screen.getAllByText('Loading...')).toBeTruthy()
    })
    test('Then, Error page should be rendered', () => {
      const html = BillsUI({ error: 'some error message' })
      document.body.innerHTML = html
      expect(screen.getAllByText('Erreur')).toBeTruthy()
    })

  })
})

describe("Given I am connected as Employee and I am on Bills page", () => {
  describe("When I click on the New Bill button", () => {
    test("Then, it should render NewBill page", () => {
      const html = BillsUI({ data: [] });
      document.body.innerHTML = html;
      const store = null;
      const allBills = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
      const handleClickNewBill = jest.fn(allBills.handleClickNewBill);
      const billBtn = screen.getByTestId("btn-new-bill");
      billBtn.addEventListener("click", handleClickNewBill);
      userEvent.click(billBtn);
      expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy();
    });
  });
});

describe("Given I am connected as Employee and I am on Bills page", () => {
  describe("When I click on the icon eye", () => {
    test("A modal should open", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const store = null;
      const allBills = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
      $.fn.modal = jest.fn();
      const eye = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(() =>
        allBills.handleClickIconEye(eye)
      );
      eye.addEventListener("click", handleClickIconEye);
      userEvent.click(eye);
      expect(handleClickIconEye).toHaveBeenCalled();
      const modale = document.getElementById("modaleFile");
      expect(modale).toBeTruthy();
    });
  });
});

// test d'intégration GET + Error API 404 / 500
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Dashboard", () => {
    test("fetches bills from mock API GET", async () => {
      const getSpy = jest.spyOn(mockStore, "bills");
      const bills = await mockStore.bills().list();
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills.length).toBe(4);
    })

    describe("When an error occurs on API", () => {
        beforeEach(() => {
          jest.spyOn(mockStore, "bills")
          const root = document.createElement("div")
          root.setAttribute("id", "root")
          document.body.appendChild(root)
          router()
        })
        test("fetches bills from an API and fails with 404 message error", async () => {
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list : () =>  {
                return Promise.reject(new Error("Erreur 404"))
              }
            }})
          const html = BillsUI({
            error: "Erreur 404"
          });
          document.body.innerHTML = html;
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 404/)
          expect(message).toBeTruthy()
        })

        test("fetches messages from an API and fails with 500 message error", async () => {
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list : () =>  {
                return Promise.reject(new Error("Erreur 500"))
              }
            }})
            const html = BillsUI({
              error: "Erreur 500"
            });
          document.body.innerHTML = html;
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 500/)
          expect(message).toBeTruthy()
        })
    })
  })

})
