export const mockChat = () => {
  return async (req:any , res: any) => {
    res.json({
      choices: [
        { message: { role: "assistant", content: "Mockapi" }}
      ]
    })
  }
}