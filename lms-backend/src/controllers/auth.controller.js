
const authService = require("../services/auth.service");

exports.register = async (req, res) => {
    try {

        const result = await authService.register(req.body);

        res.status(200).json(result);

    } catch (err) {

        res.status(400).json({
            success:false,
            message:err.message
        });

    }
};

// exports.verifyOTP = async (req, res) => {

//     try{

//         const result = await authService.verifyOTP(req.body);

//         res.json(result);

//     }catch(err){

//         res.status(400).json({
//             success:false,
//             message:err.message
//         });

//     }

// };


exports.verifyOTP = async (req, res) => {

    try {

        const result = await authService.verifyOTP(req.body);

        res.json(result);

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

// exports.login = async (req,res)=>{

//     try{

//         const result = await authService.login(req.body);

//         res.json(result);

//     }catch(err){

//         res.status(400).json({
//             success:false,
//             message:err.message
//         });

//     }

// };

exports.login = async (req, res) => {

    try {

        const result = await authService.login(req.body);

        res.json(result);

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

exports.forgotPassword = async (req, res) => {

    try {

        const result = await authService.forgotPassword(req.body);

        res.json(result);

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

exports.verifyResetOTP = async (req, res) => {

    try {

        const result = await authService.verifyResetOTP(req.body);

        res.json(result);

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

exports.resetPassword = async (req, res) => {

    try {

        const result = await authService.resetPassword(req.body);

        res.json(result);

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

exports.resendResetOTP = async (req, res) => {

    try {

        const result = await authService.resendResetOTP(req.body);

        res.json(result);

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};