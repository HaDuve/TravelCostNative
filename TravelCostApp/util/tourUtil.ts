import {
  asyncStoreGetItem,
  asyncStoreGetObject,
  asyncStoreSetItem,
  asyncStoreSetObject,
} from "../store/async-storage";

export async function loadTourConfig() {
  const hadTour = await asyncStoreGetObject("hadTour");
  console.log("loadTourConfig ~ hadTour:", hadTour);
  const freshlyCreated = await asyncStoreGetObject("freshlyCreated");
  console.log("loadTourConfig ~ freshlyCreated:", freshlyCreated);
  const needsTour = !hadTour;

  return needsTour;
}

export async function saveStoppedTour() {
  await asyncStoreSetObject("hadTour", true);
}

export async function resetTour() {
  await asyncStoreSetObject("hadTour", false);
}
