export const isValidEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
};

export const generateBookingReference = () => {
    return `BKS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};
