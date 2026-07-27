import { de, en, fr, ru } from "../../i18n/supportedLanguages";

/** User-facing Trip-container / Traveller-roster wording that P1 must retire. */
const tripAsContainerEn = /\btrips?\b/i;
const travellerRosterEn = /\btravell?ers?\b/i;
const tripAsContainerDe = /\bReisen?\b/;
const travellerRosterDe = /\bReisende[rn]?\b/;
const tripAsContainerFr = /\bvoyages?\b/i;
const travellerRosterFr = /\bvoyageur/i;
const tripAsContainerRu = /поездк/i;
const travellerRosterRu = /путешественник/i;

const P1_BUDGET_KEYS = [
  "myTrips",
  "joinTripLabel",
  "shareTripLabel",
  "tripFormTitleNew",
  "tripFormTitleEdit",
  "tripNameLabel",
  "enterNameAlert",
  "leaveTrip",
  "setActive",
  "travellers",
  "inviteTraveller",
  "inviteTravellers",
  "budgetPerTraveller",
  "paywallFeature0",
  "shareTripDescription",
  "pleaseCreateTrip",
  "trips",
  "trip",
  "tripSettledAllExpensesPaid",
  "homeFirstPromise",
] as const;

describe("home-first P1 copy sweep (issue #357)", () => {
  it("ships EN+DE+FR+RU for critical Budget/Nomad and promise keys", () => {
    for (const locale of [en, de, fr, ru]) {
      for (const key of P1_BUDGET_KEYS) {
        expect(locale[key]).toBeTruthy();
      }
    }
  });

  describe("English vocabulary", () => {
    it("uses Budget for Trip-container surfaces and Nomads for roster", () => {
      expect(en.myTrips).toBe("My Budgets");
      expect(en.joinTripLabel).toBe("Join budget");
      expect(en.shareTripLabel).toBe("Share budget");
      expect(en.tripFormTitleNew).toBe("New budget");
      expect(en.tripFormTitleEdit).toBe("Edit budget");
      expect(en.tripNameLabel).toBe("Budget name");
      expect(en.enterNameAlert).toBe("Please enter a name for your new budget.");
      expect(en.leaveTrip).toBe("Leave budget");
      expect(en.setActive).toBe("Set as active budget");
      expect(en.travellers).toBe("Nomads");
      expect(en.inviteTraveller).toBe("Invite other nomads");
      expect(en.inviteTravellers).toBe("Invite other nomads");
      expect(en.budgetPerTraveller).toBe("Budget per nomad");
      expect(en.paywallFeature0).toMatch(/budgets/i);
      expect(en.paywallFeature0).not.toMatch(tripAsContainerEn);
      expect(en.shareTripDescription).toMatch(/budget/i);
      expect(en.shareTripDescription).toMatch(/nomads/i);
      expect(en.shareTripDescription).not.toMatch(tripAsContainerEn);
      expect(en.shareTripDescription).not.toMatch(travellerRosterEn);
      expect(en.pleaseCreateTrip).toMatch(/budget/i);
      expect(en.pleaseCreateTrip).not.toMatch(tripAsContainerEn);
      expect(en.trips).toBe("Budgets");
      expect(en.trip).toBe("Budget");
      expect(en.tripSettledAllExpensesPaid).toMatch(/^Budget settled/i);
      expect(en.invitationText).toMatch(/Nomad/i);
      expect(en.invitationText).not.toMatch(travellerRosterEn);
    });

    it("ships the home-first promise and drops travel-only onboarding framing", () => {
      expect(en.homeFirstPromise).toBe(
        "Track what you spend — solo or with others."
      );
      expect(en.onb1t).toBe(en.homeFirstPromise);
      expect(en.onb2).not.toMatch(/travel/i);
      expect(en.onb2t).not.toMatch(/travel/i);
      expect(en.onb3t).not.toMatch(/journey/i);
      expect(en.paywallSubtitle).not.toMatch(/journey/i);
      expect(en.catFoodString).toBe("Food");
      expect(en.catIntTravString).toBe("Flights");
      expect(en.catAccoString).toBe("Accomodation");
      expect(en.catNatTravString).toBe("Transport");
      expect(en.catOtherString).toBe("Other");
      expect(en.welcomeToBudgetForNomads).toContain("Budget for Nomads");
      expect(en.onb1).toContain("Budget for Nomads");
    });
  });

  describe("DE/FR/RU use Budget + Nomad vocabulary (not Trip/Traveller)", () => {
    it("German uses Budget / Nomade and drops Reise/Reisende on P1 keys", () => {
      expect(de.myTrips).toMatch(/Budget/i);
      expect(de.travellers).toMatch(/Nomad/i);
      expect(de.inviteTraveller).toMatch(/Nomad/i);
      expect(de.budgetPerTraveller).toMatch(/Nomad/i);
      expect(de.tripFormTitleNew).toMatch(/Budget/i);
      expect(de.tripFormTitleNew).not.toMatch(tripAsContainerDe);
      expect(de.enterNameAlert).toMatch(/Budget/i);
      expect(de.enterNameAlert).not.toMatch(tripAsContainerDe);
      expect(de.homeFirstPromise).toBeTruthy();
      expect(de.onb1t).toBe(de.homeFirstPromise);
      for (const key of [
        "joinTripLabel",
        "shareTripLabel",
        "leaveTrip",
        "setActive",
        "pleaseCreateTrip",
        "paywallFeature0",
        "shareTripDescription",
        "tripSettledAllExpensesPaid",
      ] as const) {
        expect(de[key]).not.toMatch(tripAsContainerDe);
        expect(de[key]).not.toMatch(travellerRosterDe);
      }
    });

    it("French uses budget / nomade and drops voyage/voyageur on P1 keys", () => {
      expect(fr.myTrips).toMatch(/budget/i);
      expect(fr.travellers).toMatch(/nomad/i);
      expect(fr.inviteTraveller).toMatch(/nomad/i);
      expect(fr.tripFormTitleNew).toMatch(/budget/i);
      expect(fr.tripFormTitleNew).not.toMatch(tripAsContainerFr);
      expect(fr.homeFirstPromise).toBeTruthy();
      expect(fr.onb1t).toBe(fr.homeFirstPromise);
      for (const key of [
        "joinTripLabel",
        "shareTripLabel",
        "leaveTrip",
        "enterNameAlert",
        "pleaseCreateTrip",
        "paywallFeature0",
        "shareTripDescription",
      ] as const) {
        expect(fr[key]).not.toMatch(tripAsContainerFr);
        expect(fr[key]).not.toMatch(travellerRosterFr);
      }
    });

    it("Russian uses бюджет / номад and drops поездка/путешественник on P1 keys", () => {
      expect(ru.myTrips).toMatch(/бюджет/i);
      expect(ru.travellers).toMatch(/номад/i);
      expect(ru.inviteTraveller).toMatch(/номад/i);
      expect(ru.tripFormTitleNew).toMatch(/бюджет/i);
      expect(ru.tripFormTitleNew).not.toMatch(tripAsContainerRu);
      expect(ru.homeFirstPromise).toBeTruthy();
      expect(ru.onb1t).toBe(ru.homeFirstPromise);
      for (const key of [
        "joinTripLabel",
        "shareTripLabel",
        "leaveTrip",
        "enterNameAlert",
        "pleaseCreateTrip",
        "paywallFeature0",
        "shareTripDescription",
      ] as const) {
        expect(ru[key]).not.toMatch(tripAsContainerRu);
        expect(ru[key]).not.toMatch(travellerRosterRu);
      }
    });
  });
});
