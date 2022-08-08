import { useContext } from "react";
import { View, Text } from "react-native";
import { AuthContext } from "../../store/auth-context";
import Input from "../ManageExpense/Input";

const ProfileForm = ({
  onCancel,
  onSubmit,
  submitButtonLabel,
  defaultValues,
}) => {
  const AuthCtx = useContext(AuthContext);

  const [inputs, setInputs] = useState({
    name: {
      value: defaultValues ? defaultValues.name : "",
      isValid: true,
    },
    dailybudget: {
      value: defaultValues ? defaultValues.dailybudget : "",
      isValid: true,
    },
  });

  useLayoutEffect(() => {
    AuthCtx.
  }, [inputs]);

  function inputChangedHandler(inputIdentifier, enteredValue) {
    setInputs((curInputs) => {
      return {
        ...curInputs,
        [inputIdentifier]: { value: enteredValue, isValid: true },
      };
    });
  }

  return (
    <View style={styles.form}>
      <Text>ProfileForm</Text>
      <Input
        label="Name"
        textInputConfig={{
          onChangeText: inputChangedHandler.bind(this, "name"),
          value: inputs.name.value,
        }}
        invalid={!inputs.name.isValid}
      />
      <Input
        style={styles.rowInput}
        label="Daily Budget"
        textInputConfig={{
          keyboardType: "decimal-pad",
          onChangeText: inputChangedHandler.bind(this, "dailybudget"),
          value: inputs.dailybudget.value,
        }}
        invalid={!inputs.dailybudget.isValid}
      />
    </View>
  );
};

export default ProfileForm;

const styles = StyleSheet.create({
  form: {
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 5,
    marginBottom: 24,
    textAlign: "center",
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  inputsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowInput: {
    flex: 1,
  },
  errorText: {
    textAlign: "center",
    color: GlobalStyles.colors.error500,
    margin: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  button: {
    minWidth: 120,
    marginHorizontal: 8,
  },
});
