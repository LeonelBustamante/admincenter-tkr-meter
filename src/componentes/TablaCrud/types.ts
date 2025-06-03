export interface IModalCrud {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => void;
    valoresIniciales?: any;
}
