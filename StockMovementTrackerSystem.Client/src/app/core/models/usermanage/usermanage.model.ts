export interface UserInfoEntryModel {
    userName: string
    email: string
    phoneNumber: string
    password?: string | null;
    roleName: string
    userId: string
    fullName: any
    address: any
    status: any
    terminateDate: any
    createdOn: any
    createdBy: any
    updatedOn: any
    updatedBy: any
}

export interface UserInfoModel {
    userName: string
    email: string
    phoneNumber: string
    roleName: string
    userId: string
    fullName: any
    address: any
    status: any
    terminateDate: any
    createdOn: any
    createdBy: any
    updatedOn: any
    updatedBy: any
}

export interface ViUserInformation {
    userName: string | null;
    fullName: string | null;
    phoneNumber: string | null;
    email: string | null;
    address: string | null;
    status: boolean | null;
    createdOn: string | null;
    createdBy: string | null;
    updatedOn: string | null;
    updatedBy: string | null;
    terminateDate: string | null;
    userId: string;
    id: string;
    name: string | null;
}