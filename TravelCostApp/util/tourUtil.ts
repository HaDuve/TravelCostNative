import {
  secureStoreGetObject,
  secureStoreSetObject,
} from "../store/secure-storage";

export async function loadTourConfig() {
  const hadTour = await secureStoreGetObject("hadTour");
  console.log("loadTourConfig ~ hadTour:", hadTour);
  const needsTour = !hadTour?.value;
  console.log("loadTourConfig ~ needsTour:", needsTour);
  return needsTour;
}

export async function saveStoppedTour() {
  await secureStoreSetObject("hadTour", { value: true });
}

export async function resetTour() {
  await secureStoreSetObject("hadTour", { value: false });
}
