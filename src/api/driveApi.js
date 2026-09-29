import api from "./axios";

export const getDrives = async () => {
  const response = await api.get("/drives");
  return response.data;
};

export const createDrive = async (driveData) => {
  const response = await api.post("/drives", driveData);
  return response.data;
};

export const getDriveById = async (driveId) => {
  const response = await api.get(`/drives/${driveId}`);
  return response.data;
};